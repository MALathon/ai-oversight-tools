<script lang="ts">
	import { browser } from '$app/environment';
	import type { PageData } from './$types';
	import { GlobalFilters } from '$lib/admin';
	import Graph from 'graphology';
	import { bfsFromNode } from 'graphology-traversal';

	let { data }: { data: PageData } = $props();

	const STORAGE_KEY = 'ai-oversight-traceability';
	const VERSION_KEY = 'ai-oversight-version';
	const CURRENT_VERSION = data.traceability.version || '2.0.0';

	// Load from localStorage or use default (with version check)
	function loadLinks(): any[] {
		if (browser) {
			const savedVersion = localStorage.getItem(VERSION_KEY);
			// If version changed, clear old data and use new defaults
			if (savedVersion !== CURRENT_VERSION) {
				localStorage.removeItem(STORAGE_KEY);
				localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
				return JSON.parse(JSON.stringify(data.traceability.links));
			}
			const saved = localStorage.getItem(STORAGE_KEY);
			if (saved) {
				try {
					return JSON.parse(saved);
				} catch (e) {
					console.error('Failed to parse saved links:', e);
				}
			}
		}
		return JSON.parse(JSON.stringify(data.traceability.links));
	}

	// Deep clone editable data (from localStorage if available)
	let links = $state(loadLinks());
	let hasLocalChanges = $state(browser && localStorage.getItem(STORAGE_KEY) !== null);

	// Auto-save to localStorage when links change
	$effect(() => {
		if (browser && links) {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
			hasLocalChanges = true;
		}
	});

	// Reset to default (from JSON file)
	function resetToDefault() {
		if (confirm('Reset to default? This will discard all local changes.')) {
			links = JSON.parse(JSON.stringify(data.traceability.links));
			localStorage.removeItem(STORAGE_KEY);
			hasLocalChanges = false;
		}
	}

	// Import from file
	let fileInput: HTMLInputElement;
	function importFile() {
		fileInput?.click();
	}
	function handleFileImport(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = (event) => {
			try {
				const imported = JSON.parse(event.target?.result as string);
				if (imported.links) {
					links = imported.links;
					hasLocalChanges = true;
				} else if (Array.isArray(imported)) {
					links = imported;
					hasLocalChanges = true;
				} else {
					alert('Invalid file format. Expected traceability JSON.');
				}
			} catch (err) {
				alert('Failed to parse file: ' + err);
			}
		};
		reader.readAsText(file);
	}

	const phases = [
		{ id: 'phase-1', name: 'Phase 1: Discovery', short: 'P1' },
		{ id: 'phase-2', name: 'Phase 2: Validation', short: 'P2' },
		{ id: 'phase-3', name: 'Phase 3: Deployment', short: 'P3' }
	];

	// UI State
	let currentView = $state<'matrix' | 'trace' | 'graph'>('matrix');
	let selectedPhase = $state<string>('all');
	let selectedTechType = $state<string>('all');
	let selectedNode = $state<{ type: string; id: string } | null>(null);
	let connectingFrom = $state<{ type: string; id: string } | null>(null);
	let showLinkEditor = $state(false);
	let editingLink = $state<any>(null);
	let searchQuery = $state('');
	let focusMode = $state(false);

	// Matrix view state - configurable row and column types
	// Simplified schema: controls ARE mitigations (no separate mitigation entity)
	type EntityType = 'question' | 'risk' | 'regulation' | 'control';
	let matrixRowType = $state<EntityType>('question');
	let matrixColType = $state<EntityType>('risk');
	let matrixVerbose = $state(false);
	let matrixHoverRow = $state<string | null>(null);
	let matrixHoverCol = $state<string | null>(null);
	let showUnlinkedOnly = $state(false);

	// Determine link type for entity pair
	// Simplified: trigger (Q→R), control (R→C), regulation (R→Reg), dependency (Q→Q)
	function getLinkTypeForPair(fromType: EntityType, toType: EntityType): string | null {
		const pairs: Record<string, string> = {
			'question-risk': 'trigger',
			'risk-regulation': 'regulation',
			'risk-control': 'control',
			'question-question': 'dependency' // For showIf
		};
		return pairs[`${fromType}-${toType}`] || pairs[`${toType}-${fromType}`] || null;
	}

	// Check if pair order is reversed from canonical
	function isPairReversed(fromType: EntityType, toType: EntityType): boolean {
		const canonical: Record<string, [EntityType, EntityType]> = {
			'trigger': ['question', 'risk'],
			'regulation': ['risk', 'regulation'],
			'control': ['risk', 'control'],
			'dependency': ['question', 'question']
		};
		const linkType = getLinkTypeForPair(fromType, toType);
		if (!linkType || !canonical[linkType]) return false;
		const [canonFrom, canonTo] = canonical[linkType];
		return fromType === canonTo && toType === canonFrom;
	}

	// Filter links by phase (must be before getMatrixLink)
	let filteredLinks = $derived(
		selectedPhase === 'all'
			? links
			: links.filter((l: any) => !l.phases || l.phases.includes(selectedPhase))
	);

	// Build directed graph from filtered links using Graphology
	// Nodes are "type:id" strings, edges follow the link direction
	let traceGraph = $derived.by(() => {
		const graph = new Graph({ type: 'directed', multi: false, allowSelfLoops: false });

		for (const link of filteredLinks) {
			const fromKey = `${link.from.entity}:${link.from.id}`;
			const toKey = `${link.to.entity}:${link.to.id}`;

			// Add nodes if they don't exist
			if (!graph.hasNode(fromKey)) {
				graph.addNode(fromKey, { type: link.from.entity, id: link.from.id });
			}
			if (!graph.hasNode(toKey)) {
				graph.addNode(toKey, { type: link.to.entity, id: link.to.id });
			}

			// Add directed edge (from → to)
			const edgeKey = `${fromKey}->${toKey}`;
			if (!graph.hasEdge(edgeKey)) {
				graph.addEdgeWithKey(edgeKey, fromKey, toKey, { link });
			}
		}

		return graph;
	});

	// Get direct link between two entities (if exists)
	function getDirectLink(type1: EntityType, id1: string, type2: EntityType, id2: string): any {
		return filteredLinks.find((l: any) =>
			(l.from.entity === type1 && l.from.id === id1 && l.to.entity === type2 && l.to.id === id2) ||
			(l.from.entity === type2 && l.from.id === id2 && l.to.entity === type1 && l.to.id === id1)
		);
	}

	// Check if target is reachable from source following directed edges (downstream only)
	function isDownstreamReachable(sourceKey: string, targetKey: string): boolean {
		if (!traceGraph.hasNode(sourceKey)) return false;
		if (sourceKey === targetKey) return true;

		let found = false;
		bfsFromNode(traceGraph, sourceKey, (node) => {
			if (node === targetKey) {
				found = true;
				return true; // Stop traversal
			}
			return false;
		}, { mode: 'outbound' });

		return found;
	}

	// Check if two nodes share a common ancestor (both reachable from same node going inbound)
	function shareCommonAncestor(key1: string, key2: string): boolean {
		if (!traceGraph.hasNode(key1) || !traceGraph.hasNode(key2)) return false;

		// Find all ancestors of key1 (nodes that can reach key1)
		const ancestors1 = new Set<string>();
		bfsFromNode(traceGraph, key1, (node) => {
			ancestors1.add(node);
			return false;
		}, { mode: 'inbound' });

		// Check if any ancestor of key1 can also reach key2
		let found = false;
		bfsFromNode(traceGraph, key2, (node) => {
			if (ancestors1.has(node)) {
				found = true;
				return true;
			}
			return false;
		}, { mode: 'inbound' });

		return found;
	}

	// Get matrix connection - returns direct link, downstream transitive, or shared ancestor
	function getMatrixLink(rowType: EntityType, rowId: string, colType: EntityType, colId: string): any {
		// First check for direct link (fast)
		const direct = getDirectLink(rowType, rowId, colType, colId);
		if (direct) return { ...direct, isDirect: true };

		// Special handling for question-to-question showIf dependencies
		if (rowType === 'question' && colType === 'question' && rowId !== colId) {
			const rowQuestion = allQuestions.find(q => q.id === rowId);
			const colQuestion = allQuestions.find(q => q.id === colId);

			// Row question depends on col question (row.showIf contains col)
			if (rowQuestion?.showIf && colId in rowQuestion.showIf) {
				return {
					isDirect: true,
					isShowIf: true,
					type: 'dependency',
					direction: 'depends-on', // row depends on col
					dependentQuestion: rowId,
					requiredQuestion: colId,
					requiredValues: rowQuestion.showIf[colId]
				};
			}

			// Col question depends on row question (col.showIf contains row)
			if (colQuestion?.showIf && rowId in colQuestion.showIf) {
				return {
					isDirect: true,
					isShowIf: true,
					type: 'dependency',
					direction: 'depended-by', // row is depended on by col
					dependentQuestion: colId,
					requiredQuestion: rowId,
					requiredValues: colQuestion.showIf[rowId]
				};
			}
		}

		const rowKey = `${rowType}:${rowId}`;
		const colKey = `${colType}:${colId}`;

		// Check downstream reachability (row → col)
		if (isDownstreamReachable(rowKey, colKey)) {
			return { isDirect: false, isTransitive: true, direction: 'downstream' };
		}

		// Check upstream reachability (col → row, meaning row is downstream of col)
		if (isDownstreamReachable(colKey, rowKey)) {
			return { isDirect: false, isTransitive: true, direction: 'upstream' };
		}

		// Check shared ancestor (both connect to same risk, etc.)
		if (shareCommonAncestor(rowKey, colKey)) {
			return { isDirect: false, isTransitive: true, direction: 'sibling' };
		}

		return null;
	}

	// Toggle matrix link for any entity pair
	function toggleGenericMatrixLink(rowType: EntityType, rowId: string, colType: EntityType, colId: string) {
		const existing = getMatrixLink(rowType, rowId, colType, colId);

		if (existing?.isShowIf) {
			// showIf dependency - open the dependent question for editing
			const dependentQ = allQuestions.find(q => q.id === existing.dependentQuestion);
			if (dependentQ) {
				entityType = 'questions';
				editEntity(dependentQ);
			}
		} else if (existing?.isDirect) {
			// Edit the direct link
			const { isDirect, ...linkData } = existing;
			editingLink = JSON.parse(JSON.stringify(linkData));
			showLinkEditor = true;
		} else if (existing?.isTransitive) {
			// Transitive connection exists - offer to create direct link
			if (confirm(`These are transitively connected via the traceability chain.\n\nCreate a direct link between them?`)) {
				createNewLink(rowType, rowId, colType, colId);
			}
		} else if (rowType === 'question' && colType === 'question') {
			// Question vs Question with no existing dependency - offer to create showIf
			const rowQ = allQuestions.find(q => q.id === rowId);
			if (rowQ) {
				// Open row question for editing to add showIf condition
				entityType = 'questions';
				editEntity(rowQ);
			}
		} else {
			// No connection - create new link
			createNewLink(rowType, rowId, colType, colId);
		}
	}

	// Create a new link between two entities
	function createNewLink(type1: EntityType, id1: string, type2: EntityType, id2: string) {
		const linkType = getLinkTypeForPair(type1, type2) || 'custom';
		const reversed = isPairReversed(type1, type2);

		const fromEntity = reversed ? type2 : type1;
		const fromId = reversed ? id2 : id1;
		const toEntity = reversed ? type1 : type2;
		const toId = reversed ? id1 : id2;

		const newLink: any = {
			id: `link-${Date.now()}`,
			type: linkType,
			from: { entity: fromEntity, id: fromId },
			to: { entity: toEntity, id: toId },
			phases: ['phase-1', 'phase-2', 'phase-3']
		};

		// Add type-specific defaults
		if (linkType === 'trigger') {
			newLink.answerValues = [];
			newLink.logic = 'OR';
		} else if (linkType === 'control') {
			newLink.guidance = {}; // Phase-specific guidance for this control
		}

		editingLink = newLink;
		showLinkEditor = true;
	}

	// Trace view state
	let traceStartType = $state<'question' | 'risk' | 'control'>('question');
	let traceStartId = $state<string>('');
	let traceSelectedNode = $state<{ type: string; id: string } | null>(null);
	let traceCollapsed = $state<Set<string>>(new Set()); // Track collapsed node IDs

	function toggleTraceCollapse(nodeKey: string) {
		const newSet = new Set(traceCollapsed);
		if (newSet.has(nodeKey)) {
			newSet.delete(nodeKey);
		} else {
			newSet.add(nodeKey);
		}
		traceCollapsed = newSet;
	}

	// Trace node type for tree structure (simplified: no separate mitigation)
	interface TraceNode {
		type: 'question' | 'risk' | 'control' | 'regulation' | 'more';
		id: string;
		label: string;
		shortLabel: string;
		children: TraceNode[];
		link?: any; // The link that connects to parent
		depth: number;
		isPlaceholder?: boolean;
	}

	// Build trace tree from starting point
	let traceTree = $derived.by((): TraceNode | null => {
		if (!traceStartId) return null;

		// Helper to get question dependencies (showIf)
		function getQuestionDependents(qId: string): string[] {
			return allQuestions
				.filter(q => q.showIf && Object.keys(q.showIf).includes(qId))
				.map(q => q.id);
		}

		// Helper to get risks triggered by a question
		function getRisksForQuestion(qId: string): Array<{ risk: any; link: any }> {
			return filteredLinks
				.filter((l: any) => l.type === 'trigger' && l.from.entity === 'question' && l.from.id === qId)
				.map((l: any) => ({ risk: allRisks.find(r => r.id === l.to.id), link: l }))
				.filter(r => r.risk);
		}

		// Helper to get controls for a risk (controls ARE mitigations)
		function getControlsForRisk(rId: string): Array<{ control: any; link: any }> {
			return filteredLinks
				.filter((l: any) => l.type === 'control' && l.from.entity === 'risk' && l.from.id === rId)
				.map((l: any) => ({ control: allControls.find(c => c.id === l.to.id), link: l }))
				.filter(c => c.control);
		}

		// Helper to get regulations for a risk
		function getRegulationsForRisk(rId: string): Array<{ regulation: any; link: any }> {
			return filteredLinks
				.filter((l: any) => l.type === 'regulation' && l.from.entity === 'risk' && l.from.id === rId)
				.map((l: any) => ({ regulation: allRegulations.find(r => r.id === l.to.id), link: l }))
				.filter(r => r.regulation);
		}

		// Build question subtree (recursive for showIf dependencies)
		function buildQuestionNode(qId: string, depth: number, visited: Set<string>): TraceNode | null {
			if (visited.has(qId)) return null;
			visited.add(qId);

			const q = allQuestions.find(q => q.id === qId);
			if (!q) return null;

			const node: TraceNode = {
				type: 'question',
				id: q.id,
				label: q.text,
				shortLabel: q.id,
				children: [],
				depth
			};

			// Add dependent questions (via showIf)
			const dependents = getQuestionDependents(qId);
			for (const depId of dependents) {
				const depNode = buildQuestionNode(depId, depth + 1, visited);
				if (depNode) node.children.push(depNode);
			}

			// Add triggered risks
			const risks = getRisksForQuestion(qId);
			for (const { risk, link } of risks) {
				node.children.push(buildRiskNode(risk, link, depth + 1));
			}

			return node;
		}

		// Build risk subtree (controls are directly linked to risks now)
		function buildRiskNode(risk: any, link: any, depth: number): TraceNode {
			const node: TraceNode = {
				type: 'risk',
				id: risk.id,
				label: risk.shortName,
				shortLabel: risk.code,
				children: [],
				link,
				depth
			};

			// Add controls (controls ARE mitigations)
			const controls = getControlsForRisk(risk.id);
			for (const { control, link: cLink } of controls) {
				node.children.push({
					type: 'control',
					id: control.id,
					label: control.name,
					shortLabel: control.id.split('_')[0],
					children: [],
					link: cLink,
					depth: depth + 1
				});
			}

			// Add regulations
			const regulations = getRegulationsForRisk(risk.id);
			for (const { regulation, link: rLink } of regulations) {
				node.children.push({
					type: 'regulation',
					id: regulation.id,
					label: regulation.description,
					shortLabel: regulation.citation.split('(')[0].trim(),
					children: [],
					link: rLink,
					depth: depth + 1
				});
			}

			return node;
		}

		// Start building tree based on start type
		if (traceStartType === 'question') {
			return buildQuestionNode(traceStartId, 0, new Set());
		} else if (traceStartType === 'risk') {
			const risk = allRisks.find(r => r.id === traceStartId);
			if (!risk) return null;

			// For risk start, show controls and regulations
			const node: TraceNode = {
				type: 'risk',
				id: risk.id,
				label: risk.shortName,
				shortLabel: risk.code,
				children: [],
				depth: 0
			};

			// Add controls (controls ARE mitigations)
			const controls = getControlsForRisk(risk.id);
			for (const { control, link: cLink } of controls) {
				node.children.push({
					type: 'control',
					id: control.id,
					label: control.name,
					shortLabel: control.id.split('_')[0],
					children: [],
					link: cLink,
					depth: 1
				});
			}

			const regulations = getRegulationsForRisk(risk.id);
			for (const { regulation, link: rLink } of regulations) {
				node.children.push({
					type: 'regulation',
					id: regulation.id,
					label: regulation.description,
					shortLabel: regulation.citation.split('(')[0].trim(),
					children: [],
					link: rLink,
					depth: 1
				});
			}

			return node;
		} else {
			// Control start - show linked risks
			const ctrl = allControls.find(c => c.id === traceStartId);
			if (!ctrl) return null;

			const node: TraceNode = {
				type: 'control',
				id: ctrl.id,
				label: ctrl.name,
				shortLabel: ctrl.id.split('_')[0],
				children: [],
				depth: 0
			};

			// Find risks linked to this control
			const risksLinked = filteredLinks
				.filter((l: any) => l.type === 'control' && l.to.id === ctrl.id)
				.map((l: any) => ({ risk: allRisks.find(r => r.id === l.from.id), link: l }))
				.filter(r => r.risk);

			for (const { risk, link } of risksLinked.slice(0, 10)) {
				node.children.push({
					type: 'risk',
					id: risk.id,
					label: risk.shortName,
					shortLabel: risk.code,
					children: [],
					link,
					depth: 1
				});
			}

			return node;
		}
	});

	// Flatten trace tree into columns for rendering
	let traceColumns = $derived.by((): Map<string, TraceNode[]> => {
		const columns = new Map<string, TraceNode[]>();
		if (!traceTree) return columns;

		function collectByType(node: TraceNode) {
			const col = columns.get(node.type) || [];
			col.push(node);
			columns.set(node.type, col);
			node.children.forEach(collectByType);
		}

		collectByType(traceTree);
		return columns;
	});

	// Entity selector state (for link editor)
	let entitySelectorOpen = $state<'from' | 'to' | null>(null);
	let entitySelectorSearch = $state('');
	let entitySelectorSort = $state<'name' | 'code' | 'category'>('name');

	// Entity management state
	let entityType = $state<'questions' | 'risks' | 'regulations' | 'controls'>('risks');
	let entitySearch = $state('');
	let showEntityEditor = $state(false);
	let editingEntity = $state<any>(null);
	let isNewEntity = $state(false);

	// Show condition editor state (for question dependencies)
	let newConditionQuestionId = $state('');
	let newConditionValues = $state<string[]>([]);

	// Editable entities (full copies that can be modified)
	const ENTITIES_STORAGE_KEY = 'ai-oversight-entities';

	function loadEditableEntities() {
		if (browser) {
			const saved = localStorage.getItem(ENTITIES_STORAGE_KEY);
			if (saved) {
				try {
					return JSON.parse(saved);
				} catch (e) {
					console.error('Failed to parse saved entities:', e);
				}
			}
		}
		return null; // null means use defaults
	}

	let editableEntities = $state<{
		questions: any[] | null;
		risks: any[] | null;
		regulations: any[] | null;
		controls: any[] | null;
	}>(loadEditableEntities() || { questions: null, risks: null, regulations: null, controls: null });

	let hasEntityChanges = $derived(
		editableEntities.questions !== null ||
		editableEntities.risks !== null ||
		editableEntities.regulations !== null ||
		editableEntities.controls !== null
	);

	// Save editable entities
	$effect(() => {
		if (browser && hasEntityChanges) {
			localStorage.setItem(ENTITIES_STORAGE_KEY, JSON.stringify(editableEntities));
		}
	});

	// Reset entities to defaults
	function resetEntities() {
		if (confirm('Reset all entities to defaults? This will discard all entity changes.')) {
			editableEntities = { questions: null, risks: null, regulations: null, controls: null };
			localStorage.removeItem(ENTITIES_STORAGE_KEY);
		}
	}

	// Build flat lists for each entity type (use editable if available, else defaults)
	let defaultQuestions = $derived.by(() => {
		const items: Array<{ id: string; text: string; type: string; category: string; options: Array<{ value: string; label: string }>; showIf?: Record<string, string | string[]> }> = [];
		for (const cat of data.questionCategories) {
			for (const q of cat.questions) {
				let options: Array<{ value: string; label: string }> = [];
				if (q.type === 'yes-no') {
					options = [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }];
				} else if (q.options) {
					options = q.options.map((o: any) => ({ value: o.value, label: o.label }));
				}
				items.push({ id: q.id, text: q.question, type: q.type, category: cat.name, options, showIf: q.showIf });
			}
		}
		return items;
	});

	let defaultRisks = $derived(data.subdomains.map((s: any) => ({
		id: s.id,
		code: s.code,
		name: s.name,
		shortName: s.shortName,
		domain: s.domain,
		phaseGuidance: s.phaseGuidance || { 'phase-1': '', 'phase-2': '', 'phase-3': '' }
	})));

	// Control categories - used for organizing/filtering controls (not linkable entities)
	let controlCategories = $derived.by(() => {
		const items: Array<{ id: string; code: string; name: string; category: string }> = [];
		for (const subcat of data.controlSubcategories) {
			const cat = data.controlCategories.find((c: any) => c.id === subcat.categoryId);
			items.push({
				id: subcat.id,
				code: subcat.code,
				name: subcat.name,
				category: cat?.name || subcat.categoryId
			});
		}
		return items;
	});

	let defaultRegulations = $derived.by(() => {
		const items: Array<{ id: string; citation: string; description: string; framework: string }> = [];
		for (const [key, reg] of Object.entries(data.regulations) as [string, any][]) {
			for (const sec of reg.sections) {
				items.push({ id: sec.id, citation: sec.citation, description: sec.description, framework: reg.title });
			}
		}
		return items;
	});

	// Build controls from data
	let defaultControls = $derived(data.controls.map((c: any) => ({
		id: c.id,
		name: c.name,
		description: c.description,
		source: c.source,
		subcategoryId: c.subcategoryId,
		phases: c.phases || ['phase-1', 'phase-2', 'phase-3'],
		techTypes: c.techTypes || ['all']
	})));

	// Use editable entities if modified, otherwise defaults
	let allQuestions = $derived(editableEntities.questions ?? defaultQuestions);
	let allRisks = $derived(editableEntities.risks ?? defaultRisks);
	let allRegulations = $derived(editableEntities.regulations ?? defaultRegulations);
	let allControls = $derived(editableEntities.controls ?? defaultControls);

	// Entity type configuration for Matrix
	// Simplified schema: controls ARE mitigations (no separate mitigation entity)
	const entityConfig: Record<EntityType, {
		label: string;
		shortLabel: string;
		getAll: () => any[];
		getLabel: (item: any) => string;
		getShortLabel: (item: any) => string;
		searchText: (item: any) => string;
	}> = {
		question: {
			label: 'Questions',
			shortLabel: 'Q',
			getAll: () => allQuestions.filter(q => !['phase', 'model-types'].includes(q.id)),
			getLabel: (q) => q.text,
			getShortLabel: (q) => q.id,
			searchText: (q) => q.text + ' ' + q.id
		},
		risk: {
			label: 'Risks',
			shortLabel: 'Risk',
			getAll: () => allRisks,
			getLabel: (r) => r.shortName,
			getShortLabel: (r) => r.code,
			searchText: (r) => r.shortName + ' ' + r.name + ' ' + r.code
		},
		regulation: {
			label: 'Regulations',
			shortLabel: 'Reg',
			getAll: () => allRegulations,
			getLabel: (r) => r.citation,
			getShortLabel: (r) => r.citation.split('(')[0].trim(),
			searchText: (r) => r.citation + ' ' + r.description
		},
		control: {
			label: 'Controls',
			shortLabel: 'Ctrl',
			getAll: () => {
				let filtered = allControls;
				if (selectedPhase !== 'all') {
					filtered = filtered.filter(c => c.phases?.includes(selectedPhase));
				}
				if (selectedTechType !== 'all') {
					filtered = filtered.filter(c => c.techTypes?.includes('all') || c.techTypes?.includes(selectedTechType));
				}
				return filtered.slice(0, 100); // Limit for performance
			},
			getLabel: (c) => c.name,
			getShortLabel: (c) => c.id.split('_')[0],
			searchText: (c) => c.name + ' ' + c.id
		}
	};

	// Get matrix items for row/column with filtering
	let matrixRowItems = $derived.by(() => {
		const config = entityConfig[matrixRowType];
		let items = config.getAll();
		if (searchQuery) {
			const q = searchQuery.toLowerCase();
			items = items.filter(item => config.searchText(item).toLowerCase().includes(q));
		}
		if (showUnlinkedOnly) {
			items = items.filter(item => {
				const link = matrixColItems.some(col => getMatrixLink(matrixRowType, item.id, matrixColType, col.id));
				return !link;
			});
		}
		return items;
	});

	let matrixColItems = $derived.by(() => {
		const config = entityConfig[matrixColType];
		let items = config.getAll();
		if (showUnlinkedOnly) {
			items = items.filter(item => {
				const link = entityConfig[matrixRowType].getAll().some(row => getMatrixLink(matrixRowType, row.id, matrixColType, item.id));
				return !link;
			});
		}
		return items;
	});

	// Any entity pair is valid - we can show direct links OR transitive connections
	let matrixPairValid = $derived(true);
	// Check if there's a defined direct link type for this pair
	let matrixHasDirectLinkType = $derived(getLinkTypeForPair(matrixRowType, matrixColType) !== null);

	// Note: No pre-computed reachability needed - Graphology handles traversal efficiently

	// Get hover info for matrix (generic for any row/col type)
	let matrixHoverInfo = $derived.by(() => {
		if (!matrixHoverRow && !matrixHoverCol) return null;

		let rowInfo = '';
		let colInfo = '';

		if (matrixHoverRow) {
			const rowConfig = entityConfig[matrixRowType];
			const item = rowConfig.getAll().find((i: any) => i.id === matrixHoverRow);
			rowInfo = item ? `${rowConfig.getShortLabel(item)}: ${rowConfig.getLabel(item)}` : matrixHoverRow;
		}
		if (matrixHoverCol) {
			const colConfig = entityConfig[matrixColType];
			const item = colConfig.getAll().find((i: any) => i.id === matrixHoverCol);
			colInfo = item ? `${colConfig.getShortLabel(item)}: ${colConfig.getLabel(item)}` : matrixHoverCol;
		}

		return { row: rowInfo, col: colInfo };
	});

	// Filtered controls for graph view (by phase and tech type)
	let graphFilteredControls = $derived.by(() => {
		let filtered = allControls;
		if (selectedPhase !== 'all') {
			filtered = filtered.filter(c => c.phases?.includes(selectedPhase));
		}
		if (selectedTechType !== 'all') {
			filtered = filtered.filter(c => c.techTypes?.includes('all') || c.techTypes?.includes(selectedTechType));
		}
		return filtered;
	});

	// Visible counts for graph columns (accounting for search, focus mode, and transitive connections)
	let visibleQuestionCount = $derived.by(() => {
		const filtered = filterBySearch(allQuestions, (q: any) => q.text, 'question');
		if (!focusMode || !selectedNode) return filtered.length;
		return filtered.filter((q: any) => {
			const isSelected = selectedNode?.type === 'question' && selectedNode?.id === q.id;
			const connected = transitiveConnections.has(`question:${q.id}`);
			return isSelected || connected;
		}).length;
	});

	let visibleRiskCount = $derived.by(() => {
		const filtered = filterBySearch(allRisks, (r: any) => r.shortName + ' ' + r.name, 'risk');
		if (!focusMode || !selectedNode) return filtered.length;
		return filtered.filter((r: any) => {
			const isSelected = selectedNode?.type === 'risk' && selectedNode?.id === r.id;
			const connected = transitiveConnections.has(`risk:${r.id}`);
			return isSelected || connected;
		}).length;
	});

	let visibleRegulationCount = $derived.by(() => {
		const filtered = filterBySearch(allRegulations, (r: any) => r.citation + ' ' + r.description, 'regulation');
		if (!focusMode || !selectedNode) return filtered.length;
		return filtered.filter((r: any) => {
			const isSelected = selectedNode?.type === 'regulation' && selectedNode?.id === r.id;
			const connected = transitiveConnections.has(`regulation:${r.id}`);
			return isSelected || connected;
		}).length;
	});

	let visibleControlCount = $derived.by(() => {
		const filtered = graphFilteredControls.slice(0, 50); // Same limit as rendering
		if (!focusMode || !selectedNode) return Math.min(graphFilteredControls.length, 50);
		return filtered.filter((c: any) => {
			const isSelected = selectedNode?.type === 'control' && selectedNode?.id === c.id;
			const connected = transitiveConnections.has(`control:${c.id}`);
			return isSelected || connected;
		}).length;
	});

	// Get control link count (direct risk→control links)
	function getControlLinkCount(controlId: string): number {
		// Count risks directly linked to this control
		return filteredLinks.filter((l: any) =>
			l.type === 'control' && l.to.entity === 'control' && l.to.id === controlId
		).length;
	}

	// Get orphan counts for display (generic for any row/col type)
	let orphanStats = $derived.by(() => {
		const stats = { rows: 0, cols: 0, total: 0 };
		if (!matrixPairValid) return stats;

		const rowItems = entityConfig[matrixRowType].getAll();
		const colItems = entityConfig[matrixColType].getAll();

		// Count rows with no links to any column
		rowItems.forEach((row: any) => {
			const hasLink = colItems.some((col: any) => getMatrixLink(matrixRowType, row.id, matrixColType, col.id));
			if (!hasLink) stats.rows++;
		});

		// Count cols with no links to any row
		colItems.forEach((col: any) => {
			const hasLink = rowItems.some((row: any) => getMatrixLink(matrixRowType, row.id, matrixColType, col.id));
			if (!hasLink) stats.cols++;
		});

		stats.total = stats.rows + stats.cols;
		return stats;
	});

	// Get connections for a node
	function getConnections(type: string, id: string) {
		return filteredLinks.filter((l: any) =>
			(l.from.entity === type && l.from.id === id) ||
			(l.to.entity === type && l.to.id === id)
		);
	}

	// Get all transitively connected nodes from selected node
	// Full chain: Question → Risk → Control + Regulation
	let transitiveConnections = $derived.by(() => {
		if (!selectedNode) return new Set<string>();

		const connected = new Set<string>();
		const selectedType = selectedNode.type;

		// Helper to add node, but skip same-type items (handled separately for dependencies)
		const addNode = (type: string, id: string, allowSameType = false) => {
			if (type === selectedType && !allowSameType) return; // Don't add same-column items
			connected.add(`${type}:${id}`);
		};

		// Always add the selected node itself
		connected.add(`${selectedNode.type}:${selectedNode.id}`);

		// For questions: add dependent questions (via showIf)
		if (selectedType === 'question') {
			const selectedQ = allQuestions.find(q => q.id === selectedNode.id);
			if (selectedQ?.showIf) {
				// Find questions this one depends on
				for (const depQId of Object.keys(selectedQ.showIf)) {
					connected.add(`question:${depQId}`);
				}
			}
			// Also find questions that depend on this one
			for (const q of allQuestions) {
				if (q.showIf && selectedNode.id in q.showIf) {
					connected.add(`question:${q.id}`);
				}
			}
		}

		// For controls: add other controls in same subcategory
		if (selectedType === 'control') {
			const selectedCtrl = allControls.find(c => c.id === selectedNode.id);
			if (selectedCtrl?.subcategoryId) {
				const siblingControls = allControls.filter(c => c.subcategoryId === selectedCtrl.subcategoryId);
				for (const ctrl of siblingControls) {
					connected.add(`control:${ctrl.id}`);
				}
			}
		}

		// Get directly connected nodes (from links)
		const directLinks = filteredLinks.filter((l: any) =>
			(l.from.entity === selectedNode.type && l.from.id === selectedNode.id) ||
			(l.to.entity === selectedNode.type && l.to.id === selectedNode.id)
		);

		// Track connected risks for transitive expansion
		const connectedRisks: string[] = [];

		// First pass: direct connections from links
		for (const link of directLinks) {
			if (link.from.entity === selectedNode.type && link.from.id === selectedNode.id) {
				addNode(link.to.entity, link.to.id);
				if (link.to.entity === 'risk') connectedRisks.push(link.to.id);
			} else {
				addNode(link.from.entity, link.from.id);
				if (link.from.entity === 'risk') connectedRisks.push(link.from.id);
			}
		}

		// Second pass: expand from risks to their connections (controls, regulations)
		for (const riskId of connectedRisks) {
			const riskLinks = filteredLinks.filter((l: any) =>
				(l.from.entity === 'risk' && l.from.id === riskId) ||
				(l.to.entity === 'risk' && l.to.id === riskId)
			);
			for (const link of riskLinks) {
				if (link.from.entity === 'risk' && link.from.id === riskId) {
					addNode(link.to.entity, link.to.id);
				} else {
					addNode(link.from.entity, link.from.id);
				}
			}
		}

		return connected;
	});

	// Check if node is connected to selected (including transitive)
	function isConnected(type: string, id: string): boolean {
		if (!selectedNode) return false;
		return transitiveConnections.has(`${type}:${id}`);
	}

	// Get the link between selected node and another node
	function getConnectionToSelected(type: string, id: string) {
		if (!selectedNode) return null;
		return filteredLinks.find((l: any) =>
			(l.from.entity === selectedNode.type && l.from.id === selectedNode.id && l.to.entity === type && l.to.id === id) ||
			(l.to.entity === selectedNode.type && l.to.id === selectedNode.id && l.from.entity === type && l.from.id === id) ||
			(l.from.entity === type && l.from.id === id && l.to.entity === selectedNode.type && l.to.id === selectedNode.id) ||
			(l.to.entity === type && l.to.id === id && l.from.entity === selectedNode.type && l.from.id === selectedNode.id)
		);
	}

	// Get link between two nodes
	function getLinkBetween(type1: string, id1: string, type2: string, id2: string) {
		return links.find((l: any) =>
			(l.from.entity === type1 && l.from.id === id1 && l.to.entity === type2 && l.to.id === id2) ||
			(l.from.entity === type2 && l.from.id === id2 && l.to.entity === type1 && l.to.id === id1)
		);
	}

	// Handle node click
	function handleNodeClick(type: string, id: string) {
		if (connectingFrom) {
			// We're in connection mode
			if (connectingFrom.type === type && connectingFrom.id === id) {
				// Clicked same node, cancel
				connectingFrom = null;
			} else {
				// Create or edit link
				const existing = getLinkBetween(connectingFrom.type, connectingFrom.id, type, id);
				if (existing) {
					editingLink = JSON.parse(JSON.stringify(existing));
					showLinkEditor = true;
				} else {
					// Determine link type based on node types (simplified schema: no mitigation entity)
					let linkType = 'custom';
					if (connectingFrom.type === 'question' && type === 'risk') linkType = 'trigger';
					else if (connectingFrom.type === 'risk' && type === 'question') linkType = 'trigger';
					else if (connectingFrom.type === 'question' && type === 'question') linkType = 'dependency';
					else if ((connectingFrom.type === 'risk' && type === 'regulation') || (connectingFrom.type === 'regulation' && type === 'risk')) linkType = 'regulation';
					else if ((connectingFrom.type === 'risk' && type === 'control') || (connectingFrom.type === 'control' && type === 'risk')) linkType = 'control';

					// Determine from/to order based on link type conventions
					let fromNode, toNode;
					if (linkType === 'dependency') {
						fromNode = connectingFrom;
						toNode = { type, id };
					} else if (connectingFrom.type === 'question' || connectingFrom.type === 'risk') {
						fromNode = connectingFrom;
						toNode = { type, id };
					} else {
						fromNode = { type, id };
						toNode = connectingFrom;
					}

					editingLink = {
						id: `link-${Date.now()}`,
						type: linkType,
						from: { entity: fromNode.type, id: fromNode.id },
						to: { entity: toNode.type, id: toNode.id },
						phases: ['phase-1', 'phase-2', 'phase-3'],
						answerValues: [],
						logic: 'OR',
						guidance: {}
					};
					showLinkEditor = true;
				}
				connectingFrom = null;
			}
		} else {
			// Check if clicking a connected node - if so, edit that connection
			const connectionLink = getConnectionToSelected(type, id);
			if (connectionLink) {
				editingLink = JSON.parse(JSON.stringify(connectionLink));
				showLinkEditor = true;
				return;
			}

			// Select or deselect
			if (selectedNode?.type === type && selectedNode?.id === id) {
				selectedNode = null;
			} else {
				selectedNode = { type, id };
			}
		}
	}

	// Start connection
	function startConnect(type: string, id: string, e: Event) {
		e.stopPropagation();
		connectingFrom = { type, id };
		selectedNode = null;
	}

	// Save link
	function saveLink() {
		if (!editingLink) return;
		const idx = links.findIndex((l: any) => l.id === editingLink.id);
		if (idx >= 0) {
			links[idx] = editingLink;
		} else {
			links = [...links, editingLink];
		}
		showLinkEditor = false;
		editingLink = null;
	}

	// Delete link
	function deleteLink() {
		if (!editingLink) return;
		links = links.filter((l: any) => l.id !== editingLink.id);
		showLinkEditor = false;
		editingLink = null;
	}

	// Get entity display info
	function getQuestion(id: string) { return allQuestions.find(q => q.id === id); }
	function getRisk(id: string) { return allRisks.find((r: any) => r.id === id); }
	function getRegulation(id: string) { return allRegulations.find(r => r.id === id); }
	function getControl(id: string) { return allControls.find(c => c.id === id); }
	function getControlCategory(id: string) { return controlCategories.find((s: any) => s.id === id); }

	// Get question dependencies (showIf relationships)
	function getQuestionDependencies(questionId: string): { dependsOn: string[], dependedBy: string[] } {
		const q = getQuestion(questionId);
		const dependsOn: string[] = q?.showIf ? Object.keys(q.showIf) : [];
		const dependedBy: string[] = allQuestions
			.filter(other => other.showIf && questionId in other.showIf)
			.map(other => other.id);
		return { dependsOn, dependedBy };
	}

	// Get available entities for selector based on link type and position
	// Simplified: trigger (Q→R), control (R→C), regulation (R→Reg), dependency (Q→Q)
	function getSelectableEntities(position: 'from' | 'to', linkType: string) {
		if (linkType === 'trigger') {
			if (position === 'from') return allQuestions.map(q => ({ id: q.id, name: q.text, code: q.id, category: q.category, type: 'question' }));
			else return allRisks.map(r => ({ id: r.id, name: r.shortName, code: r.code, category: r.domain, type: 'risk' }));
		} else if (linkType === 'control') {
			if (position === 'from') return allRisks.map(r => ({ id: r.id, name: r.shortName, code: r.code, category: r.domain, type: 'risk' }));
			else return allControls.map(c => ({ id: c.id, name: c.name, code: c.id.split('_')[0], category: c.source || '', type: 'control' }));
		} else if (linkType === 'regulation') {
			if (position === 'from') return allRisks.map(r => ({ id: r.id, name: r.shortName, code: r.code, category: r.domain, type: 'risk' }));
			else return allRegulations.map(r => ({ id: r.id, name: r.description, code: r.citation, category: r.framework, type: 'regulation' }));
		} else if (linkType === 'dependency') {
			// Question depends on question
			return allQuestions.map(q => ({ id: q.id, name: q.text, code: q.id, category: q.category, type: 'question' }));
		}
		return [];
	}

	// Filter and sort entities for selector
	let filteredSelectorEntities = $derived.by(() => {
		if (!entitySelectorOpen || !editingLink) return [];
		const entities = getSelectableEntities(entitySelectorOpen, editingLink.type);
		let filtered = entities;

		if (entitySelectorSearch) {
			const q = entitySelectorSearch.toLowerCase();
			filtered = entities.filter(e =>
				e.name.toLowerCase().includes(q) ||
				e.code.toLowerCase().includes(q) ||
				e.category.toLowerCase().includes(q)
			);
		}

		// Sort
		filtered.sort((a, b) => {
			if (entitySelectorSort === 'name') return a.name.localeCompare(b.name);
			if (entitySelectorSort === 'code') return a.code.localeCompare(b.code);
			if (entitySelectorSort === 'category') return a.category.localeCompare(b.category);
			return 0;
		});

		return filtered;
	});

	// Select entity from selector
	function selectEntity(entity: { id: string; type: string }) {
		if (!editingLink || !entitySelectorOpen) return;
		editingLink[entitySelectorOpen] = { entity: entity.type, id: entity.id };
		entitySelectorOpen = null;
		entitySelectorSearch = '';
	}

	// Filter entities by search for entity manager
	let filteredEntities = $derived.by(() => {
		const q = entitySearch.toLowerCase();
		if (entityType === 'questions') {
			return allQuestions.filter(e => !q || e.text.toLowerCase().includes(q) || e.id.toLowerCase().includes(q) || e.category.toLowerCase().includes(q));
		} else if (entityType === 'risks') {
			return allRisks.filter(e => !q || e.name.toLowerCase().includes(q) || e.code.toLowerCase().includes(q) || e.shortName.toLowerCase().includes(q));
		} else if (entityType === 'regulations') {
			return allRegulations.filter(e => !q || e.description.toLowerCase().includes(q) || e.citation.toLowerCase().includes(q));
		} else if (entityType === 'controls') {
			return allControls.filter(e => !q || e.name.toLowerCase().includes(q) || e.id.toLowerCase().includes(q) || e.source?.toLowerCase().includes(q));
		}
		return [];
	});

	// Ensure we have a mutable copy of entities for a type
	function ensureEditableCopy(type: 'questions' | 'risks' | 'regulations' | 'controls') {
		if (editableEntities[type] === null) {
			if (type === 'questions') editableEntities.questions = JSON.parse(JSON.stringify(defaultQuestions));
			else if (type === 'risks') editableEntities.risks = JSON.parse(JSON.stringify(defaultRisks));
			else if (type === 'regulations') editableEntities.regulations = JSON.parse(JSON.stringify(defaultRegulations));
			else if (type === 'controls') editableEntities.controls = JSON.parse(JSON.stringify(defaultControls));
		}
	}

	// Create new entity
	function createNewEntity() {
		isNewEntity = true;
		if (entityType === 'questions') {
			editingEntity = { id: '', text: '', type: 'yes-no', category: 'Custom', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }], showIf: undefined };
			newConditionQuestionId = '';
			newConditionValues = [];
		} else if (entityType === 'risks') {
			editingEntity = { id: '', code: '', name: '', shortName: '', domain: '', phaseGuidance: { 'phase-1': '', 'phase-2': '', 'phase-3': '' } };
		} else if (entityType === 'regulations') {
			editingEntity = { id: '', citation: '', description: '', framework: '' };
		} else if (entityType === 'controls') {
			editingEntity = { id: '', name: '', description: '', source: '', subcategoryId: '', phases: ['phase-1', 'phase-2', 'phase-3'], techTypes: ['all'] };
		}
		showEntityEditor = true;
	}

	// Edit entity
	function editEntity(entity: any) {
		isNewEntity = false;
		editingEntity = JSON.parse(JSON.stringify(entity));
		newConditionQuestionId = '';
		newConditionValues = [];
		showEntityEditor = true;
	}

	// Save entity
	function saveEntity() {
		if (!editingEntity) return;

		// Generate ID if new
		if (isNewEntity && !editingEntity.id) {
			editingEntity.id = `${entityType.slice(0, -1)}-${Date.now()}`;
		}

		ensureEditableCopy(entityType);
		const list = editableEntities[entityType] as any[];
		const idx = list.findIndex((e: any) => e.id === editingEntity.id);

		if (idx >= 0) {
			list[idx] = editingEntity;
		} else {
			list.push(editingEntity);
		}

		editableEntities = { ...editableEntities };
		showEntityEditor = false;
		editingEntity = null;
	}

	// Delete entity
	function deleteEntity() {
		if (!editingEntity) return;
		if (!confirm('Delete this entity? This cannot be undone.')) return;

		ensureEditableCopy(entityType);
		editableEntities[entityType] = (editableEntities[entityType] as any[]).filter((e: any) => e.id !== editingEntity.id);
		editableEntities = { ...editableEntities };
		showEntityEditor = false;
		editingEntity = null;
	}

	function getEntityName(entity: string, id: string): string {
		if (entity === 'question') return getQuestion(id)?.text || id;
		if (entity === 'risk') return getRisk(id)?.shortName || id;
		if (entity === 'regulation') return getRegulation(id)?.citation || id;
		if (entity === 'control') return getControl(id)?.name || id;
		return id;
	}

	// Export
	function exportConfig() {
		const output = {
			"$schema": "./schemas/traceability.schema.json",
			"version": "1.0.0",
			"lastUpdated": new Date().toISOString().split('T')[0],
			"description": "Graph-based traceability",
			"nodes": data.traceability.nodes,
			"links": links
		};
		const blob = new Blob([JSON.stringify(output, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'traceability.json';
		a.click();
		URL.revokeObjectURL(url);
	}

	// Filter entities by search (but always include connected items when something is selected)
	function filterBySearch<T extends { id: string }>(items: T[], getText: (item: T) => string, entityType?: string): T[] {
		if (!searchQuery) return items;
		const q = searchQuery.toLowerCase();
		return items.filter(item => {
			// Always include if matches search
			if (getText(item).toLowerCase().includes(q) || item.id.toLowerCase().includes(q)) return true;
			// Always include if connected to selected node (for traceability)
			if (selectedNode && entityType && transitiveConnections.has(`${entityType}:${item.id}`)) return true;
			return false;
		});
	}

	// Count links for a node
	function getLinkCount(type: string, id: string): number {
		return filteredLinks.filter((l: any) =>
			(l.from.entity === type && l.from.id === id) ||
			(l.to.entity === type && l.to.id === id)
		).length;
	}

	// Get selected node details
	let selectedDetails = $derived.by(() => {
		if (!selectedNode) return null;
		const { type, id } = selectedNode;
		const connections = getConnections(type, id);

		if (type === 'question') {
			const q = getQuestion(id);
			return { type, item: q, connections };
		} else if (type === 'risk') {
			const r = getRisk(id);
			return { type, item: r, connections };
		} else if (type === 'regulation') {
			const r = getRegulation(id);
			return { type, item: r, connections };
		} else if (type === 'control') {
			const c = getControl(id);
			return { type, item: c, connections };
		}
		return null;
	});
</script>

<svelte:head>
	<title>Traceability Admin - AI Oversight Tools</title>
</svelte:head>

<div class="admin">
	<header class="header">
		<div class="header-left">
			<h1>Traceability</h1>
			<div class="view-tabs">
				<button class:active={currentView === 'matrix'} onclick={() => currentView = 'matrix'}>Matrix</button>
				<button class:active={currentView === 'trace'} onclick={() => currentView = 'trace'}>Trace</button>
				<button class:active={currentView === 'graph'} onclick={() => currentView = 'graph'}>Graph</button>
			</div>
		</div>
		<div class="header-right">
			{#if hasLocalChanges}
				<span class="status-badge local">Local changes</span>
			{:else}
				<span class="status-badge default">Default</span>
			{/if}
			<GlobalFilters
				{phases}
				modelTypes={data.modelTypes}
				{selectedPhase}
				{selectedTechType}
				onPhaseChange={(p) => selectedPhase = p}
				onTechTypeChange={(t) => selectedTechType = t}
			/>
			<input type="file" accept=".json" bind:this={fileInput} onchange={handleFileImport} style="display: none" />
			<button class="btn" onclick={importFile}>Import</button>
			<button class="btn primary" onclick={exportConfig}>Export</button>
			{#if hasLocalChanges}
				<button class="btn danger-outline" onclick={resetToDefault}>Reset</button>
			{/if}
		</div>
	</header>

	<!-- MATRIX VIEW -->
	{#if currentView === 'matrix'}
		<div class="matrix-toolbar">
			<div class="matrix-selectors">
				<div class="selector-group">
					<label>Rows:</label>
					<select bind:value={matrixRowType}>
						<option value="question">Questions</option>
						<option value="risk">Risks</option>
						<option value="regulation">Regulations</option>
						<option value="control">Controls</option>
					</select>
				</div>
				<span class="selector-arrow">→</span>
				<div class="selector-group">
					<label>Columns:</label>
					<select bind:value={matrixColType}>
						<option value="question">Questions</option>
						<option value="risk">Risks</option>
						<option value="regulation">Regulations</option>
						<option value="control">Controls</option>
					</select>
				</div>
				{#if !matrixPairValid}
					<span class="no-link-warning">No link type for this pair</span>
				{/if}
			</div>
			<div class="matrix-options">
				<label class="verbose-toggle">
					<input type="checkbox" bind:checked={matrixVerbose} />
					<span>Verbose</span>
				</label>
				<label class="verbose-toggle" class:warning={orphanStats.total > 0}>
					<input type="checkbox" bind:checked={showUnlinkedOnly} />
					<span>Unlinked only</span>
					{#if orphanStats.total > 0}
						<span class="orphan-badge">{orphanStats.total}</span>
					{/if}
				</label>
				<input type="text" placeholder="Search rows..." bind:value={searchQuery} class="search" />
			</div>
		</div>

		<!-- Hover info bar - always reserve space -->
		<div class="matrix-hover-info" class:has-content={matrixHoverInfo}>
			{#if matrixHoverInfo?.row}
				<div class="hover-row">
					<span class="hover-label">Row:</span>
					<span class="hover-value">{matrixHoverInfo.row}</span>
				</div>
			{/if}
			{#if matrixHoverInfo?.col}
				<div class="hover-col">
					<span class="hover-label">Col:</span>
					<span class="hover-value">{matrixHoverInfo.col}</span>
				</div>
			{/if}
		</div>

		<div class="matrix-container" onmouseleave={() => { matrixHoverRow = null; matrixHoverCol = null; }}>
			{#if matrixRowItems.length === 0 || matrixColItems.length === 0}
				<div class="matrix-no-pair">
					<p>No items to display. {matrixRowItems.length} rows, {matrixColItems.length} columns.</p>
				</div>
			{:else}
				{@const rowConfig = entityConfig[matrixRowType]}
				{@const colConfig = entityConfig[matrixColType]}
				<table class="matrix">
					<thead>
						<tr>
							<th class="row-header">{rowConfig.label}</th>
							{#each matrixColItems as colItem}
								<th
									class="col-header clickable"
									class:highlighted={matrixHoverCol === colItem.id}
									title={`${colConfig.getLabel(colItem)} (click to edit)`}
									onmouseenter={() => matrixHoverCol = colItem.id}
									onclick={() => { entityType = matrixColType === 'question' ? 'questions' : matrixColType === 'risk' ? 'risks' : matrixColType === 'regulation' ? 'regulations' : 'controls'; editEntity(colItem); }}
								>
									{#if matrixVerbose}
										<span class="verbose-label">{colConfig.getLabel(colItem)}</span>
									{:else}
										{colConfig.getShortLabel(colItem)}
									{/if}
								</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each matrixRowItems as rowItem}
							<tr class:row-highlighted={matrixHoverRow === rowItem.id}>
								<td
									class="row-label clickable"
									class:highlighted={matrixHoverRow === rowItem.id}
									title={`${rowConfig.getLabel(rowItem)} (click to edit)`}
									onmouseenter={() => matrixHoverRow = rowItem.id}
									onclick={() => { entityType = matrixRowType === 'question' ? 'questions' : matrixRowType === 'risk' ? 'risks' : matrixRowType === 'regulation' ? 'regulations' : 'controls'; editEntity(rowItem); }}
								>
									{#if matrixVerbose}
										<span class="verbose-label">{rowConfig.getLabel(rowItem)}</span>
									{:else}
										{rowConfig.getShortLabel(rowItem)}
									{/if}
								</td>
								{#each matrixColItems as colItem}
									{@const link = getMatrixLink(matrixRowType, rowItem.id, matrixColType, colItem.id)}
									<td
										class="matrix-cell"
										class:linked={link?.isDirect && !link?.isShowIf}
										class:showif-depends={link?.isShowIf && link?.direction === 'depends-on'}
										class:showif-depended={link?.isShowIf && link?.direction === 'depended-by'}
										class:transitive-downstream={link?.isTransitive && link?.direction === 'downstream'}
										class:transitive-upstream={link?.isTransitive && link?.direction === 'upstream'}
										class:transitive-sibling={link?.isTransitive && link?.direction === 'sibling'}
										class:col-highlighted={matrixHoverCol === colItem.id}
										class:row-highlighted={matrixHoverRow === rowItem.id}
										onclick={() => toggleGenericMatrixLink(matrixRowType, rowItem.id, matrixColType, colItem.id)}
										onmouseenter={() => { matrixHoverRow = rowItem.id; matrixHoverCol = colItem.id; }}
										title={link?.isShowIf ? `${link.direction === 'depends-on' ? 'Row depends on column' : 'Column depends on row'} (click to edit showIf)` : link?.isDirect ? `Direct link (click to edit)` : link?.isTransitive ? `${link.direction === 'downstream' ? 'Downstream' : link.direction === 'upstream' ? 'Upstream' : 'Sibling'} connection (click to create direct)` : `No connection (click to create)`}
									>
										{#if link?.isShowIf}
											<span class="cell-marker showif">{link.direction === 'depends-on' ? '→' : '←'}</span>
										{:else if link?.isDirect}
											<span class="cell-marker direct">✓</span>
										{:else if link?.isTransitive}
											<span class="cell-marker transitive-{link.direction}">{link.direction === 'downstream' ? '↓' : link.direction === 'upstream' ? '↑' : '~'}</span>
										{/if}
									</td>
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}
		</div>

	<!-- TRACE VIEW (placeholder - will build visual flow editor) -->
	{:else if currentView === 'trace'}
		{#if connectingFrom}
			<div class="connection-banner">
				Connecting from: <strong>{getEntityName(connectingFrom.type, connectingFrom.id)}</strong> — Click a node in the tree to link them
				<button onclick={() => connectingFrom = null}>Cancel</button>
			</div>
		{/if}
		<div class="trace-view">
			<div class="trace-toolbar">
				<div class="trace-start-selector">
					<label>Start from:</label>
					<select bind:value={traceStartType}>
						<option value="question">Question</option>
						<option value="risk">Risk</option>
						<option value="control">Control</option>
					</select>
					{#if traceStartType === 'question'}
						<select bind:value={traceStartId}>
							<option value="">Select a question...</option>
							{#each allQuestions.filter(q => !q.showIf || Object.keys(q.showIf).length === 0) as q}
								<option value={q.id}>{q.id}: {q.text.slice(0, 50)}...</option>
							{/each}
						</select>
					{:else if traceStartType === 'risk'}
						<select bind:value={traceStartId}>
							<option value="">Select a risk...</option>
							{#each allRisks as r}
								<option value={r.id}>{r.code}: {r.shortName}</option>
							{/each}
						</select>
					{:else}
						<select bind:value={traceStartId}>
							<option value="">Select a control...</option>
							{#each allControls.slice(0, 100) as c}
								<option value={c.id}>{c.id}: {c.name.slice(0, 40)}...</option>
							{/each}
						</select>
					{/if}
				</div>
			</div>
			<div class="trace-canvas">
				{#if !traceStartId}
					<div class="trace-placeholder">
						<p>Select a starting point above to visualize the dependency flow.</p>
						<p class="hint">You'll see questions → risks → controls → regulations as a visual tree.</p>
					</div>
				{:else if !traceTree}
					<div class="trace-placeholder">
						<p>No data found for <strong>{traceStartType}</strong>: {traceStartId}</p>
					</div>
				{:else}
					{@const renderNode = (node: TraceNode, parentId?: string): any => null}
					<div class="trace-flow">
						{#snippet traceNode(node: TraceNode, indent: number)}
							{@const nodeKey = `${node.type}:${node.id}`}
							{@const isCollapsed = traceCollapsed.has(nodeKey)}
							<div class="trace-row" style="--indent: {indent}">
								<div
									class="trace-node {node.type}"
									class:selected={traceSelectedNode?.type === node.type && traceSelectedNode?.id === node.id}
									class:placeholder={node.isPlaceholder}
									class:has-children={node.children.length > 0}
								>
									{#if node.children.length > 0}
										<button
											class="trace-collapse-btn"
											title={isCollapsed ? 'Expand' : 'Collapse'}
											onclick={(e) => { e.stopPropagation(); toggleTraceCollapse(nodeKey); }}
										>{isCollapsed ? '▶' : '▼'}</button>
									{:else}
										<span class="trace-collapse-spacer"></span>
									{/if}
									{#if node.link}
										<button
											class="trace-link-btn"
											title="Edit connection to parent"
											onclick={(e) => { e.stopPropagation(); editingLink = JSON.parse(JSON.stringify(node.link)); showLinkEditor = true; }}
										>
											<span class="link-icon">⟿</span>
											<span class="link-text">edit link</span>
										</button>
									{/if}
									<button
										class="trace-node-content"
										onclick={() => {
											if (node.isPlaceholder) return;
											if (connectingFrom) {
												handleNodeClick(node.type, node.id);
											} else {
												traceSelectedNode = { type: node.type, id: node.id };
											}
										}}
									>
										<span class="trace-node-type">{node.type === 'more' ? '+' : node.type.charAt(0).toUpperCase()}</span>
										<span class="trace-node-label">
											{#if node.isPlaceholder}
												{node.label}
											{:else}
												<strong>{node.shortLabel}</strong>: {node.label}
											{/if}
										</span>
									</button>
									{#if node.children.length > 0}
										<span class="trace-children-count">{node.children.length}</span>
									{/if}
								</div>
								{#if node.children.length > 0 && !isCollapsed}
									<div class="trace-children">
										{#each node.children as child}
											{@render traceNode(child, indent + 1)}
										{/each}
									</div>
								{/if}
							</div>
						{/snippet}

						<!-- Render tree starting from root -->
						{@render traceNode(traceTree, 0)}

						<!-- Stats summary -->
						<div class="trace-stats">
							{#each Array.from(traceColumns.entries()) as [type, nodes]}
								<span class="trace-stat {type}">{nodes.length} {type}{nodes.length !== 1 ? 's' : ''}</span>
							{/each}
						</div>
					</div>

					<!-- Selected node details panel -->
					{#if traceSelectedNode}
						{@const selectedItem = (() => {
							const t = traceSelectedNode.type;
							const id = traceSelectedNode.id;
							if (t === 'question') return allQuestions.find(q => q.id === id);
							if (t === 'risk') return allRisks.find(r => r.id === id);
							if (t === 'control') return allControls.find(c => c.id === id);
							if (t === 'regulation') return allRegulations.find(r => r.id === id);
							return null;
						})()}
						<aside class="detail-panel">
							<div class="detail-header">
								<span class="detail-type {traceSelectedNode.type}">{traceSelectedNode.type}</span>
								<button class="close-btn" onclick={() => traceSelectedNode = null}>×</button>
							</div>
							{#if selectedItem}
								{#if traceSelectedNode.type === 'question'}
									<h3>{selectedItem.text}</h3>
									<div class="detail-meta">
										<span class="meta-item">ID: {selectedItem.id}</span>
										<span class="meta-item">Type: {selectedItem.type}</span>
										<span class="meta-item">Category: {selectedItem.category}</span>
									</div>
									{#if selectedItem.options?.length}
										<div class="detail-options">
											<strong>Options:</strong>
											{#each selectedItem.options as opt}
												<span class="option-tag">{opt.label}</span>
											{/each}
										</div>
									{/if}
									{#if selectedItem.showIf}
										<div class="detail-section">
											<strong>Show when:</strong>
											<div class="showif-summary">
												{#each Object.entries(selectedItem.showIf) as [qId, val]}
													<span class="showif-condition">{qId} = {Array.isArray(val) ? val.join(' or ') : val}</span>
												{/each}
											</div>
										</div>
									{/if}
									<button class="btn edit-entity" onclick={() => { entityType = 'questions'; editEntity(selectedItem); }}>
										Edit Question
									</button>
								{:else if traceSelectedNode.type === 'risk'}
									<h3>{selectedItem.name}</h3>
									<div class="detail-meta">
										<span class="meta-item">Code: {selectedItem.code}</span>
										<span class="meta-item">Domain: {selectedItem.domain}</span>
									</div>
									<p class="detail-desc">{selectedItem.shortName}</p>
									<button class="btn edit-entity" onclick={() => { entityType = 'risks'; editEntity(selectedItem); }}>
										Edit Risk
									</button>
								{:else if traceSelectedNode.type === 'regulation'}
									<h3>{selectedItem.citation}</h3>
									<div class="detail-meta">
										<span class="meta-item">{selectedItem.framework}</span>
									</div>
									<p class="detail-desc">{selectedItem.description}</p>
									<button class="btn edit-entity" onclick={() => { entityType = 'regulations'; editEntity(selectedItem); }}>
										Edit Regulation
									</button>
								{:else if traceSelectedNode.type === 'control'}
									{@const subcategory = getControlSubcategory(selectedItem.subcategoryId)}
									<h3>{selectedItem.name}</h3>
									<div class="detail-meta">
										<span class="meta-item">ID: {selectedItem.id}</span>
										<span class="meta-item">Source: {selectedItem.source}</span>
									</div>
									{#if selectedItem.description}
										<p class="detail-desc">{selectedItem.description}</p>
									{/if}
									<div class="detail-section">
										<strong>Category:</strong>
										{#if subcategory}
											<span class="category-badge">{subcategory.code}: {subcategory.name}</span>
										{:else}
											<span>{selectedItem.subcategoryId}</span>
										{/if}
									</div>
									<div class="detail-section">
										<strong>Phases:</strong>
										<div class="phase-badges">
											{#each selectedItem.phases || [] as phase}
												<span class="phase-badge">{phase.replace('phase-', 'P')}</span>
											{/each}
										</div>
									</div>
									<button class="btn edit-entity" onclick={() => { entityType = 'controls'; editEntity(selectedItem); }}>
										Edit Control
									</button>
								{/if}

								<!-- Connections section -->
								{@const traceConnections = getConnections(traceSelectedNode.type, traceSelectedNode.id)}
								<div class="connections-section">
									<h4>Connections ({traceConnections.length})</h4>
									{#if traceConnections.length === 0}
										<p class="no-connections">No direct connections yet.</p>
									{:else}
										<div class="connection-list">
											{#each traceConnections as link}
												{@const isFrom = link.from.entity === traceSelectedNode.type && link.from.id === traceSelectedNode.id}
												{@const otherEntity = isFrom ? link.to.entity : link.from.entity}
												{@const otherId = isFrom ? link.to.id : link.from.id}
												<button class="connection-item" onclick={() => { editingLink = JSON.parse(JSON.stringify(link)); showLinkEditor = true; }}>
													<span class="conn-type {link.type}">{link.type}</span>
													<span class="conn-direction">{isFrom ? '→' : '←'}</span>
													<span class="conn-target {otherEntity}">{getEntityName(otherEntity, otherId)}</span>
													{#if link.phases}
														<span class="conn-phases">{link.phases.map((p: string) => p.replace('phase-', 'P')).join(', ')}</span>
													{/if}
												</button>
											{/each}
										</div>
									{/if}
								</div>

								<button class="btn connect-action" onclick={() => startConnect(traceSelectedNode.type, traceSelectedNode.id, new Event('click'))}>
									+ Create Connection
								</button>
							{:else}
								<p class="no-data">Item not found</p>
							{/if}
						</aside>
					{/if}
				{/if}
			</div>
		</div>

	<!-- GRAPH VIEW -->
	{:else if currentView === 'graph'}
		{#if connectingFrom}
			<div class="connection-banner">
				Connecting from: <strong>{getEntityName(connectingFrom.type, connectingFrom.id)}</strong> — Click another item to link them
				<button onclick={() => connectingFrom = null}>Cancel</button>
			</div>
		{:else if !selectedNode}
			<div class="help-banner">
				<strong>How to link:</strong> Click an item to select it, then click <span class="plus-hint">+</span> on it (or another item) to create a connection.
				Questions trigger Risks. Risks link to Control Categories and Regulations.
			</div>
		{/if}

		<div class="graph-toolbar">
			<button class="btn focus-toggle" class:active={focusMode} onclick={() => focusMode = !focusMode}>
				{focusMode ? 'Focus: ON' : 'Focus'}
			</button>
			<input type="text" placeholder="Search graph..." bind:value={searchQuery} class="search" />
		</div>

		<div class="layout">
		<!-- Four Columns -->
		<div class="columns">
			<!-- Questions Column -->
			<div class="column questions">
				<div class="column-header">
					<span class="column-icon">?</span>
					<h2>Questions</h2>
					<span class="count" title="{visibleQuestionCount} of {allQuestions.length}">{visibleQuestionCount}</span>
				</div>
				<div class="nodes">
					{#each filterBySearch(allQuestions, q => q.text, 'question') as q}
						{@const linkCount = getLinkCount('question', q.id)}
						{@const deps = getQuestionDependencies(q.id)}
						{@const isSelected = selectedNode?.type === 'question' && selectedNode?.id === q.id}
						{@const connected = isConnected('question', q.id)}
						{@const connectionLink = getConnectionToSelected('question', q.id)}
						{@const shouldHide = focusMode && selectedNode && !isSelected && !connected}
						{#if !shouldHide}
						<div
							class="node question"
							class:selected={isSelected}
							class:connected
							class:has-deps={deps.dependsOn.length > 0 || deps.dependedBy.length > 0}
							class:connecting={connectingFrom?.type === 'question' && connectingFrom?.id === q.id}
							role="button"
							tabindex="0"
							onclick={() => handleNodeClick('question', q.id)}
							onkeydown={(e) => e.key === 'Enter' && handleNodeClick('question', q.id)}
						>
							<div class="node-header">
								<span class="node-id">{q.id}</span>
								<span class="link-count" title="Connections">{linkCount}</span>
							</div>
							<div class="node-text">{q.text}</div>
							{#if deps.dependsOn.length > 0 || deps.dependedBy.length > 0}
								<div class="node-deps">
									{#if deps.dependsOn.length > 0}
										<span class="dep-badge depends-on" title="Depends on: {deps.dependsOn.join(', ')}">← {deps.dependsOn.length}</span>
									{/if}
									{#if deps.dependedBy.length > 0}
										<span class="dep-badge depended-by" title="Required by: {deps.dependedBy.join(', ')}">{deps.dependedBy.length} →</span>
									{/if}
								</div>
							{/if}
							{#if connected && connectionLink}
								<span class="conn-indicator">{connectionLink.type}</span>
							{/if}
							<button class="connect-btn" title="Connect to..." onclick={(e) => startConnect('question', q.id, e)}>+</button>
						</div>
						{/if}
					{/each}
				</div>
			</div>

			<!-- Risks Column -->
			<div class="column risks">
				<div class="column-header">
					<span class="column-icon">!</span>
					<h2>Risks</h2>
					<span class="count" title="{visibleRiskCount} of {allRisks.length}">{visibleRiskCount}</span>
				</div>
				<div class="nodes">
					{#each filterBySearch(allRisks, r => r.shortName + ' ' + r.name, 'risk') as r}
						{@const linkCount = getLinkCount('risk', r.id)}
						{@const isSelected = selectedNode?.type === 'risk' && selectedNode?.id === r.id}
						{@const connected = isConnected('risk', r.id)}
						{@const connectionLink = getConnectionToSelected('risk', r.id)}
						{@const shouldHide = focusMode && selectedNode && !isSelected && !connected}
						{#if !shouldHide}
						<div
							class="node risk"
							class:selected={isSelected}
							class:connected
							class:connecting={connectingFrom?.type === 'risk' && connectingFrom?.id === r.id}
							role="button"
							tabindex="0"
							onclick={() => handleNodeClick('risk', r.id)}
							onkeydown={(e) => e.key === 'Enter' && handleNodeClick('risk', r.id)}
						>
							<div class="node-header">
								<span class="node-code">{r.code}</span>
								<span class="link-count" title="Connections">{linkCount}</span>
							</div>
							<div class="node-text">{r.shortName}</div>
							{#if connected && connectionLink}
								<span class="conn-indicator">{connectionLink.type}</span>
							{/if}
							<button class="connect-btn" title="Connect to..." onclick={(e) => startConnect('risk', r.id, e)}>+</button>
						</div>
						{/if}
					{/each}
				</div>
			</div>

			<!-- Regulations Column -->
			<div class="column regulations">
				<div class="column-header">
					<span class="column-icon">R</span>
					<h2>Regulations</h2>
					<span class="count" title="{visibleRegulationCount} of {allRegulations.length}">{visibleRegulationCount}</span>
				</div>
				<div class="nodes">
					{#each filterBySearch(allRegulations, r => r.citation + ' ' + r.description, 'regulation') as r}
						{@const linkCount = getLinkCount('regulation', r.id)}
						{@const isSelected = selectedNode?.type === 'regulation' && selectedNode?.id === r.id}
						{@const connected = isConnected('regulation', r.id)}
						{@const connectionLink = getConnectionToSelected('regulation', r.id)}
						{@const shouldHide = focusMode && selectedNode && !isSelected && !connected}
						{#if !shouldHide}
						<div
							class="node regulation"
							class:selected={isSelected}
							class:connected
							class:connecting={connectingFrom?.type === 'regulation' && connectingFrom?.id === r.id}
							role="button"
							tabindex="0"
							onclick={() => handleNodeClick('regulation', r.id)}
							onkeydown={(e) => e.key === 'Enter' && handleNodeClick('regulation', r.id)}
						>
							<div class="node-header">
								<span class="node-code">{r.citation}</span>
								<span class="link-count" title="Connections">{linkCount}</span>
							</div>
							<div class="node-text">{r.description}</div>
							{#if connected && connectionLink}
								<span class="conn-indicator">{connectionLink.type}</span>
							{/if}
							<button class="connect-btn" title="Connect to..." onclick={(e) => startConnect('regulation', r.id, e)}>+</button>
						</div>
						{/if}
					{/each}
				</div>
			</div>

			<!-- Controls Column (filtered by global phase/tech) -->
			<div class="column controls">
				<div class="column-header">
					<span class="column-icon">⚙</span>
					<h2>Controls</h2>
					<span class="count" title="{visibleControlCount} of {graphFilteredControls.length}">{visibleControlCount}</span>
				</div>
				<div class="nodes">
					{#each graphFilteredControls.slice(0, 50) as ctrl}
						{@const directLinkCount = getLinkCount('control', ctrl.id)}
						{@const subcategoryLinkCount = getControlLinkCount(ctrl.id)}
						{@const totalLinks = directLinkCount + subcategoryLinkCount}
						{@const subcategory = getControlSubcategory(ctrl.subcategoryId)}
						{@const isSelected = selectedNode?.type === 'control' && selectedNode?.id === ctrl.id}
						{@const connected = isConnected('control', ctrl.id)}
						{@const connectionLink = getConnectionToSelected('control', ctrl.id)}
						{@const shouldHide = focusMode && selectedNode && !isSelected && !connected}
						{#if !shouldHide}
						<div
							class="node control"
							class:selected={isSelected}
							class:connected
							class:connecting={connectingFrom?.type === 'control' && connectingFrom?.id === ctrl.id}
							role="button"
							tabindex="0"
							onclick={() => handleNodeClick('control', ctrl.id)}
							onkeydown={(e) => e.key === 'Enter' && handleNodeClick('control', ctrl.id)}
						>
							<div class="node-header">
								<span class="node-code">{ctrl.id.split('_')[0]}</span>
								<span class="link-count" title="Direct: {directLinkCount}, Via category: {subcategoryLinkCount}">{totalLinks}</span>
							</div>
							<div class="node-text">{ctrl.name}</div>
							<div class="node-meta">
								<span class="phases">{ctrl.phases?.map((p: string) => p.replace('phase-', 'P')).join(' ')}</span>
								{#if subcategory}
									<span class="subcategory" title="Subcategory">{subcategory.code}</span>
								{/if}
							</div>
							{#if connected && connectionLink}
								<span class="conn-indicator">{connectionLink.type}</span>
							{:else if connected}
								<span class="conn-indicator">via {subcategory?.code || 'category'}</span>
							{/if}
							<button class="connect-btn" title="Connect to..." onclick={(e) => startConnect('control', ctrl.id, e)}>+</button>
						</div>
						{/if}
					{/each}
					{#if graphFilteredControls.length > 50}
						<div class="more-indicator">...and {graphFilteredControls.length - 50} more (use filters)</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Detail Panel -->
		{#if selectedDetails}
			<aside class="detail-panel">
				<div class="detail-header">
					<span class="detail-type {selectedDetails.type}">{selectedDetails.type}</span>
					<button class="close-btn" onclick={() => selectedNode = null}>×</button>
				</div>

				{#if selectedDetails.type === 'question' && selectedDetails.item}
					<h3>{selectedDetails.item.text}</h3>
					<div class="detail-meta">
						<span class="meta-item">ID: {selectedDetails.item.id}</span>
						<span class="meta-item">Type: {selectedDetails.item.type}</span>
						<span class="meta-item">Category: {selectedDetails.item.category}</span>
					</div>
					<div class="detail-options">
						<strong>Options:</strong>
						{#each selectedDetails.item.options as opt}
							<span class="option-tag">{opt.label}</span>
						{/each}
					</div>
					<button class="btn edit-entity" onclick={() => { entityType = 'questions'; editEntity(selectedDetails.item); }}>
						Edit Question
					</button>
				{:else if selectedDetails.type === 'risk' && selectedDetails.item}
					<h3>{selectedDetails.item.name}</h3>
					<div class="detail-meta">
						<span class="meta-item">Code: {selectedDetails.item.code}</span>
						<span class="meta-item">Domain: {selectedDetails.item.domain}</span>
					</div>
					<p class="detail-desc">{selectedDetails.item.shortName}</p>
					<button class="btn edit-entity" onclick={() => { entityType = 'risks'; editEntity(selectedDetails.item); }}>
						Edit Risk
					</button>
				{:else if selectedDetails.type === 'regulation' && selectedDetails.item}
					<h3>{selectedDetails.item.citation}</h3>
					<div class="detail-meta">
						<span class="meta-item">{selectedDetails.item.framework}</span>
					</div>
					<p class="detail-desc">{selectedDetails.item.description}</p>
					<button class="btn edit-entity" onclick={() => { entityType = 'regulations'; editEntity(selectedDetails.item); }}>
						Edit Regulation
					</button>
				{:else if selectedDetails.type === 'control' && selectedDetails.item}
					{@const subcategory = getControlSubcategory(selectedDetails.item.subcategoryId)}
					<h3>{selectedDetails.item.name}</h3>
					<div class="detail-meta">
						<span class="meta-item">ID: {selectedDetails.item.id}</span>
						<span class="meta-item">Source: {selectedDetails.item.source}</span>
					</div>
					{#if selectedDetails.item.description}
						<p class="detail-desc">{selectedDetails.item.description}</p>
					{/if}
					<div class="detail-section">
						<strong>Category:</strong>
						{#if subcategory}
							<span class="category-badge">{subcategory.code}: {subcategory.name}</span>
						{:else}
							<span>{selectedDetails.item.subcategoryId}</span>
						{/if}
					</div>
					<div class="detail-section">
						<strong>Phases:</strong>
						<div class="phase-badges">
							{#each selectedDetails.item.phases || [] as phase}
								<span class="phase-badge">{phase.replace('phase-', 'P')}</span>
							{/each}
						</div>
					</div>
					<div class="detail-section">
						<strong>Tech Types:</strong>
						<div class="tech-badges">
							{#each selectedDetails.item.techTypes || [] as tech}
								<span class="tech-badge">{tech}</span>
							{/each}
						</div>
					</div>
					<button class="btn edit-control" onclick={() => { entityType = 'controls'; editEntity(selectedDetails.item); }}>
						Edit Control
					</button>
				{/if}

				<div class="connections-section">
					<h4>Connections ({selectedDetails.connections.length})</h4>
					{#if selectedDetails.connections.length === 0}
						<p class="no-connections">No connections yet. Click + on another node to create one.</p>
					{:else}
						<div class="connection-list">
							{#each selectedDetails.connections as link}
								{@const isFrom = link.from.entity === selectedDetails.type && link.from.id === selectedDetails.item?.id}
								{@const otherEntity = isFrom ? link.to.entity : link.from.entity}
								{@const otherId = isFrom ? link.to.id : link.from.id}
								<button class="connection-item" onclick={() => { editingLink = link; showLinkEditor = true; }}>
									<span class="conn-type {link.type}">{link.type}</span>
									<span class="conn-direction">{isFrom ? '→' : '←'}</span>
									<span class="conn-target {otherEntity}">{getEntityName(otherEntity, otherId)}</span>
									{#if link.phases}
										<span class="conn-phases">{link.phases.map((p: string) => p.replace('phase-', 'P')).join(', ')}</span>
									{/if}
								</button>
							{/each}
						</div>
					{/if}
				</div>

				<button class="btn connect-action" onclick={() => startConnect(selectedDetails.type, selectedDetails.item?.id || '', new Event('click'))}>
					+ Create Connection
				</button>
			</aside>
		{/if}
	</div>
	{/if}

</div>

<!-- Entity Editor Modal -->
{#if showEntityEditor && editingEntity}
	<div class="modal-overlay" role="dialog" aria-modal="true">
		<div class="modal entity-editor">
			<div class="modal-header">
				<h3>{isNewEntity ? 'New' : 'Edit'} {entityType.slice(0, -1)}</h3>
				<button class="close-btn" onclick={() => { showEntityEditor = false; editingEntity = null; }}>×</button>
			</div>

			<div class="modal-body">
				{#if entityType === 'risks'}
					<div class="form-group">
						<label>Code (e.g., "1.4")</label>
						<input type="text" bind:value={editingEntity.code} placeholder="1.4" />
					</div>
					<div class="form-group">
						<label>Short Name</label>
						<input type="text" bind:value={editingEntity.shortName} placeholder="Brief name" />
					</div>
					<div class="form-group">
						<label>Full Name</label>
						<input type="text" bind:value={editingEntity.name} placeholder="Full descriptive name" />
					</div>
					<div class="form-group">
						<label>Domain</label>
						<input type="text" bind:value={editingEntity.domain} placeholder="Risk domain" />
					</div>

					<!-- Phase Guidance Editor -->
					<div class="phase-guidance-section">
						<h4>Phase-Specific Guidance</h4>
						<p class="guidance-hint">Prose that researchers can adapt for their IRB protocols</p>

						{#if editingEntity.phaseGuidance}
							<div class="form-group">
								<label>Phase 1: Discovery <span class="phase-tag p1">P1</span></label>
								<textarea
									bind:value={editingEntity.phaseGuidance['phase-1']}
									placeholder="Guidance for Phase 1 (Discovery) - retrospective data, algorithm development..."
									rows="4"
								></textarea>
							</div>
							<div class="form-group">
								<label>Phase 2: Validation <span class="phase-tag p2">P2</span></label>
								<textarea
									bind:value={editingEntity.phaseGuidance['phase-2']}
									placeholder="Guidance for Phase 2 (Validation) - prospective testing, controlled settings..."
									rows="4"
								></textarea>
							</div>
							<div class="form-group">
								<label>Phase 3: Deployment <span class="phase-tag p3">P3</span></label>
								<textarea
									bind:value={editingEntity.phaseGuidance['phase-3']}
									placeholder="Guidance for Phase 3 (Deployment) - live use, influences decisions..."
									rows="4"
								></textarea>
							</div>
						{/if}
					</div>
				{:else if entityType === 'questions'}
					<div class="form-group">
						<label>ID (no spaces, lowercase)</label>
						<input type="text" bind:value={editingEntity.id} placeholder="my-question-id" />
					</div>
					<div class="form-group">
						<label>Question Text</label>
						<textarea bind:value={editingEntity.text} placeholder="Enter the question..." rows="3"></textarea>
					</div>
					<div class="form-group">
						<label>Type</label>
						<select bind:value={editingEntity.type}>
							<option value="yes-no">Yes/No</option>
							<option value="single-select">Single Select</option>
							<option value="multi-select">Multi Select</option>
						</select>
					</div>
					<div class="form-group">
						<label>Category</label>
						<input type="text" bind:value={editingEntity.category} placeholder="Category" />
					</div>

					<!-- Show Conditions Editor -->
					<div class="form-group show-conditions">
						<label>Show Conditions <span class="hint">(Only show this question when...)</span></label>
						{#if !editingEntity.showIf || Object.keys(editingEntity.showIf).length === 0}
							<p class="no-conditions">Always shown (no conditions)</p>
						{:else}
							<div class="conditions-list">
								{#each Object.entries(editingEntity.showIf) as [questionId, values]}
									{@const depQuestion = allQuestions.find(q => q.id === questionId)}
									<div class="condition-item">
										<span class="condition-question">{depQuestion?.text || questionId}</span>
										<span class="condition-equals">=</span>
										<span class="condition-values">
											{#if Array.isArray(values)}
												{values.map(v => {
													const opt = depQuestion?.options?.find(o => o.value === v);
													return opt?.label || v;
												}).join(' OR ')}
											{:else}
												{@const opt = depQuestion?.options?.find(o => o.value === values)}
												{opt?.label || values}
											{/if}
										</span>
										<button
											class="remove-condition"
											onclick={() => {
												const newShowIf = { ...editingEntity.showIf };
												delete newShowIf[questionId];
												editingEntity.showIf = Object.keys(newShowIf).length > 0 ? newShowIf : undefined;
											}}
											title="Remove condition"
										>×</button>
									</div>
								{/each}
							</div>
						{/if}

						<!-- Add New Condition -->
						<div class="add-condition">
							<select
								bind:value={newConditionQuestionId}
								onchange={() => { newConditionValues = []; }}
							>
								<option value="">Select dependency question...</option>
								{#each allQuestions.filter(q => q.id !== editingEntity.id) as q}
									<option value={q.id} disabled={editingEntity.showIf?.[q.id] !== undefined}>
										{q.text.length > 50 ? q.text.slice(0, 50) + '...' : q.text}
									</option>
								{/each}
							</select>

							{#if newConditionQuestionId}
								{@const selectedQ = allQuestions.find(q => q.id === newConditionQuestionId)}
								{#if selectedQ?.options}
									<div class="condition-values-select">
										<span class="when-label">when answer is:</span>
										{#each selectedQ.options as opt}
											<label class="checkbox-label">
												<input
													type="checkbox"
													checked={newConditionValues.includes(opt.value)}
													onchange={(e) => {
														if (e.currentTarget.checked) {
															newConditionValues = [...newConditionValues, opt.value];
														} else {
															newConditionValues = newConditionValues.filter(v => v !== opt.value);
														}
													}}
												/>
												{opt.label}
											</label>
										{/each}
									</div>
									<button
										class="btn small"
										disabled={newConditionValues.length === 0}
										onclick={() => {
											const newShowIf = { ...editingEntity.showIf };
											newShowIf[newConditionQuestionId] = newConditionValues.length === 1
												? newConditionValues[0]
												: [...newConditionValues];
											editingEntity.showIf = newShowIf;
											newConditionQuestionId = '';
											newConditionValues = [];
										}}
									>
										Add Condition
									</button>
								{/if}
							{/if}
						</div>
					</div>
				{:else if entityType === 'regulations'}
					<div class="form-group">
						<label>Citation (e.g., "45 CFR 46.111(a)(1)")</label>
						<input type="text" bind:value={editingEntity.citation} placeholder="45 CFR 46.111(a)(1)" />
					</div>
					<div class="form-group">
						<label>Description</label>
						<textarea bind:value={editingEntity.description} placeholder="Description of the regulation..." rows="3"></textarea>
					</div>
					<div class="form-group">
						<label>Framework</label>
						<input type="text" bind:value={editingEntity.framework} placeholder="e.g., Common Rule, HIPAA" />
					</div>
				{:else if entityType === 'controls'}
					<div class="form-group">
						<label>ID</label>
						<input type="text" bind:value={editingEntity.id} placeholder="e.g., A0001_Source2024" />
					</div>
					<div class="form-group">
						<label>Name</label>
						<input type="text" bind:value={editingEntity.name} placeholder="Control name" />
					</div>
					<div class="form-group">
						<label>Description</label>
						<textarea bind:value={editingEntity.description} placeholder="Description of the control..." rows="4"></textarea>
					</div>
					<div class="form-group">
						<label>Source</label>
						<input type="text" bind:value={editingEntity.source} placeholder="e.g., NIST2024, Bengio2025" />
					</div>
					<div class="form-group">
						<label>Subcategory</label>
						<select bind:value={editingEntity.subcategoryId}>
							<option value="">Select subcategory...</option>
							{#each data.controlSubcategories as subcat}
								<option value={subcat.id}>{subcat.code} {subcat.name}</option>
							{/each}
						</select>
					</div>
					<div class="form-group">
						<label>Applicable Phases</label>
						<div class="checkbox-group">
							{#each phases as phase}
								<label class="checkbox-label">
									<input
										type="checkbox"
										checked={editingEntity.phases?.includes(phase.id)}
										onchange={(e) => {
											if (e.currentTarget.checked) {
												editingEntity.phases = [...(editingEntity.phases || []), phase.id];
											} else {
												editingEntity.phases = (editingEntity.phases || []).filter((p: string) => p !== phase.id);
											}
										}}
									/>
									{phase.name}
								</label>
							{/each}
						</div>
					</div>
					<div class="form-group">
						<label>Applicable Technology Types</label>
						<div class="checkbox-group tech-types">
							<label class="checkbox-label all-types">
								<input
									type="checkbox"
									checked={editingEntity.techTypes?.includes('all')}
									onchange={(e) => {
										if (e.currentTarget.checked) {
											editingEntity.techTypes = ['all'];
										} else {
											editingEntity.techTypes = [];
										}
									}}
								/>
								All Types
							</label>
							{#if !editingEntity.techTypes?.includes('all')}
								{#each data.modelTypes as modelType}
									<label class="checkbox-label">
										<input
											type="checkbox"
											checked={editingEntity.techTypes?.includes(modelType.id)}
											onchange={(e) => {
												if (e.currentTarget.checked) {
													editingEntity.techTypes = [...(editingEntity.techTypes || []).filter((t: string) => t !== 'all'), modelType.id];
												} else {
													editingEntity.techTypes = (editingEntity.techTypes || []).filter((t: string) => t !== modelType.id);
												}
											}}
										/>
										{modelType.name}
									</label>
								{/each}
							{/if}
						</div>
					</div>
				{/if}
			</div>

			<div class="modal-footer">
				{#if !isNewEntity}
					<button class="btn danger" onclick={deleteEntity}>Delete</button>
				{:else}
					<div></div>
				{/if}
				<div class="footer-right">
					<button class="btn" onclick={() => { showEntityEditor = false; editingEntity = null; }}>Cancel</button>
					<button class="btn primary" onclick={saveEntity}>Save</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- Link Editor Modal -->
{#if showLinkEditor && editingLink}
	<div class="modal-overlay" role="dialog" aria-modal="true">
		<div class="modal link-editor">
			<div class="modal-header">
				<h3>{links.some((l: any) => l.id === editingLink.id) ? 'Edit' : 'New'} Link</h3>
				<button class="close-btn" onclick={() => { showLinkEditor = false; editingLink = null; }}>×</button>
			</div>

			<div class="modal-body">
				<div class="link-preview">
					<button
						class="link-node-btn {editingLink.from.entity}"
						onclick={() => { entitySelectorOpen = 'from'; entitySelectorSearch = ''; }}
						title="Click to change"
					>
						{getEntityName(editingLink.from.entity, editingLink.from.id)}
						<span class="change-icon">↻</span>
					</button>
					<span class="link-arrow">→</span>
					<button
						class="link-node-btn {editingLink.to.entity}"
						onclick={() => { entitySelectorOpen = 'to'; entitySelectorSearch = ''; }}
						title="Click to change"
					>
						{getEntityName(editingLink.to.entity, editingLink.to.id)}
						<span class="change-icon">↻</span>
					</button>
				</div>

				<!-- Entity Selector Dropdown -->
				{#if entitySelectorOpen}
					<div class="entity-selector">
						<div class="entity-selector-header">
							<span class="selector-label">Select {entitySelectorOpen === 'from' ? 'source' : 'target'}:</span>
							<button class="close-selector" onclick={() => entitySelectorOpen = null}>×</button>
						</div>
						<div class="entity-selector-toolbar">
							<input
								type="text"
								placeholder="Search..."
								bind:value={entitySelectorSearch}
								class="selector-search"
							/>
							<select bind:value={entitySelectorSort} class="selector-sort">
								<option value="name">Sort: Name</option>
								<option value="code">Sort: Code</option>
								<option value="category">Sort: Category</option>
							</select>
						</div>
						<div class="entity-selector-list">
							{#each filteredSelectorEntities as entity}
								<button
									class="entity-option"
									class:selected={editingLink[entitySelectorOpen]?.id === entity.id}
									onclick={() => selectEntity(entity)}
								>
									<span class="entity-code {entity.type}">{entity.code}</span>
									<span class="entity-name">{entity.name}</span>
									<span class="entity-category">{entity.category}</span>
								</button>
							{:else}
								<div class="no-entities">No matching items found</div>
							{/each}
						</div>
					</div>
				{/if}

				<div class="form-group">
					<label>Link Type</label>
					<select bind:value={editingLink.type} onchange={() => {
						// Reset entities when type changes
						if (editingLink.type === 'trigger') {
							editingLink.from = { entity: 'question', id: allQuestions[0]?.id || '' };
							editingLink.to = { entity: 'risk', id: allRisks[0]?.id || '' };
						} else if (editingLink.type === 'dependency') {
							editingLink.from = { entity: 'question', id: allQuestions[0]?.id || '' };
							editingLink.to = { entity: 'question', id: allQuestions[1]?.id || allQuestions[0]?.id || '' };
						} else if (editingLink.type === 'regulation') {
							editingLink.from = { entity: 'risk', id: allRisks[0]?.id || '' };
							editingLink.to = { entity: 'regulation', id: allRegulations[0]?.id || '' };
						} else if (editingLink.type === 'control') {
							editingLink.from = { entity: 'risk', id: allRisks[0]?.id || '' };
							editingLink.to = { entity: 'control', id: allControls[0]?.id || '' };
						}
					}}>
						<option value="trigger">Trigger (Question → Risk)</option>
						<option value="dependency">Dependency (Question → Question)</option>
						<option value="control">Control (Risk → Control)</option>
						<option value="regulation">Regulation (Risk → Regulation)</option>
					</select>
				</div>

				<div class="form-group">
					<label>Applicable Phases</label>
					<div class="phase-checkboxes">
						{#each phases as phase}
							<label class="checkbox-label">
								<input
									type="checkbox"
									checked={editingLink.phases?.includes(phase.id) || false}
									onchange={(e) => {
										if (e.currentTarget.checked) {
											editingLink.phases = [...(editingLink.phases || []), phase.id];
										} else {
											editingLink.phases = (editingLink.phases || []).filter((p: string) => p !== phase.id);
										}
									}}
								/>
								{phase.name}
							</label>
						{/each}
					</div>
				</div>

				{#if editingLink.type === 'trigger' && editingLink.from.entity === 'question'}
					{@const q = getQuestion(editingLink.from.id)}
					{#if q}
						<div class="form-group">
							<label>Trigger when answer is:</label>
							<div class="answer-checkboxes">
								{#each q.options as opt}
									<label class="checkbox-label">
										<input
											type="checkbox"
											checked={editingLink.answerValues?.includes(opt.value) || false}
											onchange={(e) => {
												if (e.currentTarget.checked) {
													editingLink.answerValues = [...(editingLink.answerValues || []), opt.value];
												} else {
													editingLink.answerValues = (editingLink.answerValues || []).filter((v: string) => v !== opt.value);
												}
											}}
										/>
										{opt.label}
									</label>
								{/each}
							</div>
						</div>

						<div class="form-group">
							<label>Logic (when multiple triggers for same risk)</label>
							<select bind:value={editingLink.logic}>
								<option value="OR">OR - Any trigger activates</option>
								<option value="AND">AND - All triggers required</option>
							</select>
						</div>
					{/if}
				{/if}

				{#if editingLink.type === 'control'}
					<div class="form-group">
						<label>Phase-specific Guidance</label>
						{#each phases as phase}
							{#if editingLink.phases?.includes(phase.id)}
								<div class="guidance-input">
									<span class="guidance-phase">{phase.short}</span>
									<textarea
										placeholder="Guidance for {phase.name}..."
										value={editingLink.guidance?.[phase.id] || ''}
										oninput={(e) => {
											if (!editingLink.guidance) editingLink.guidance = {};
											editingLink.guidance[phase.id] = e.currentTarget.value;
										}}
										rows="2"
									></textarea>
								</div>
							{/if}
						{/each}
					</div>
				{/if}

				{#if editingLink.type === 'regulation'}
					<div class="form-group">
						<label>Note</label>
						<input type="text" bind:value={editingLink.note} placeholder="Brief note about this regulatory link..." />
					</div>
				{/if}
			</div>

			<div class="modal-footer">
				{#if links.some((l: any) => l.id === editingLink.id)}
					<button class="btn danger" onclick={deleteLink}>Delete Link</button>
				{/if}
				<div class="footer-right">
					<button class="btn" onclick={() => { showLinkEditor = false; editingLink = null; }}>Cancel</button>
					<button class="btn primary" onclick={saveLink}>Save</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	/* Custom scrollbars */
	::-webkit-scrollbar {
		width: 8px;
		height: 8px;
	}

	::-webkit-scrollbar-track {
		background: transparent;
	}

	::-webkit-scrollbar-thumb {
		background: #334155;
		border-radius: 4px;
	}

	::-webkit-scrollbar-thumb:hover {
		background: #475569;
	}

	::-webkit-scrollbar-corner {
		background: transparent;
	}

	/* Firefox scrollbar */
	* {
		scrollbar-width: thin;
		scrollbar-color: #334155 transparent;
	}

	.admin {
		display: flex;
		flex-direction: column;
		height: calc(100vh - 80px);
		overflow: hidden;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 0;
		border-bottom: 1px solid #334155;
		flex-shrink: 0;
	}

	.header-left, .header-right {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.header h1 {
		font-size: 1.125rem;
		color: #f1f5f9;
	}

	.view-tabs {
		display: flex;
		gap: 0.25rem;
		background: #1e293b;
		padding: 0.25rem;
		border-radius: 0.375rem;
	}

	.view-tabs button {
		padding: 0.375rem 0.75rem;
		background: transparent;
		border: none;
		border-radius: 0.25rem;
		color: #94a3b8;
		font-size: 0.8125rem;
		cursor: pointer;
	}

	.view-tabs button:hover { color: #e2e8f0; }
	.view-tabs button.active { background: #60a5fa; color: #0f172a; }

	/* Matrix View */
	.matrix-toolbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 0;
		border-bottom: 1px solid #334155;
		gap: 1rem;
	}

	.matrix-selectors {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.selector-group {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.selector-group label {
		font-size: 0.75rem;
		color: #94a3b8;
	}

	.selector-group select {
		padding: 0.375rem 0.75rem;
		background: #1e293b;
		border: 1px solid #334155;
		border-radius: 0.375rem;
		color: #f1f5f9;
		font-size: 0.75rem;
		cursor: pointer;
	}

	.selector-group select:focus {
		outline: none;
		border-color: #60a5fa;
	}

	.selector-arrow {
		font-size: 1rem;
		color: #64748b;
		font-weight: bold;
	}

	.no-link-warning {
		font-size: 0.7rem;
		color: #f59e0b;
		background: rgba(245, 158, 11, 0.1);
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
	}

	.matrix-no-pair {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem;
		text-align: center;
		color: #94a3b8;
	}

	.matrix-no-pair p {
		margin: 0.25rem 0;
	}

	.matrix-no-pair .hint {
		font-size: 0.75rem;
		color: #64748b;
	}

	.matrix-options {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.verbose-toggle {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.75rem;
		color: #94a3b8;
		cursor: pointer;
	}

	.verbose-toggle input {
		cursor: pointer;
	}

	.verbose-toggle:hover {
		color: #e2e8f0;
	}

	.verbose-toggle.warning {
		color: #f59e0b;
	}

	.orphan-badge {
		background: #f59e0b;
		color: #1e293b;
		font-size: 0.65rem;
		font-weight: 700;
		padding: 0.1rem 0.35rem;
		border-radius: 9999px;
		margin-left: 0.25rem;
	}

	/* Link count badges - hidden by default, shown when filtering unlinked */
	.link-count {
		display: none;
	}

	/* Orphan highlighting - subtle, only when filtering */
	.col-header.orphan,
	.row-label.orphan {
		/* No styling by default - only styled when showUnlinkedOnly is true */
	}

	/* Matrix hover info bar - always reserves space */
	.matrix-hover-info {
		display: flex;
		gap: 2rem;
		padding: 0.5rem 0.75rem;
		background: transparent;
		font-size: 0.75rem;
		height: 2.5rem;
		align-items: center;
		opacity: 0;
		transition: opacity 0.15s ease;
	}

	.matrix-hover-info.has-content {
		opacity: 1;
		background: #1e293b;
		border-bottom: 1px solid #334155;
	}

	.hover-row, .hover-col {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		flex: 1;
		overflow: hidden;
	}

	.hover-label {
		color: #64748b;
		font-weight: 600;
		flex-shrink: 0;
	}

	.hover-value {
		color: #e2e8f0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.hover-row .hover-value {
		color: #60a5fa;
	}

	.hover-col .hover-value {
		color: #22c55e;
	}

	.matrix-container {
		flex: 1;
		overflow: auto;
		padding: 1rem 0;
	}

	.controls-matrix-note {
		padding: 0.5rem 1rem;
		background: rgba(6, 182, 212, 0.1);
		border-left: 3px solid #06b6d4;
		margin-bottom: 0.5rem;
		font-size: 0.75rem;
		color: #94a3b8;
	}

	.matrix {
		border-collapse: collapse;
		font-size: 0.75rem;
	}

	.matrix th, .matrix td {
		border: 1px solid #334155;
		padding: 0.25rem;
		text-align: center;
	}

	.matrix .row-header {
		background: #1e293b;
		color: #94a3b8;
		font-weight: 600;
		text-align: left;
		padding: 0.5rem;
		position: sticky;
		left: 0;
		top: 0;
		z-index: 3;
	}

	.matrix .col-header {
		background: #1e293b;
		color: #94a3b8;
		font-weight: 500;
		font-size: 0.625rem;
		padding: 0.375rem 0.25rem;
		writing-mode: vertical-lr;
		text-orientation: mixed;
		transform: rotate(180deg);
		white-space: nowrap;
		max-width: 2rem;
		position: sticky;
		top: 0;
		z-index: 2;
		transition: background 0.1s, color 0.1s;
	}

	.matrix .col-header.highlighted {
		background: rgba(34, 197, 94, 0.15);
		color: #22c55e;
	}

	.matrix .col-header .verbose-label {
		max-height: 120px;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.matrix .row-label {
		background: #0f172a;
		color: #e2e8f0;
		font-family: monospace;
		font-size: 0.625rem;
		text-align: left;
		padding: 0.375rem 0.5rem;
		position: sticky;
		left: 0;
		z-index: 1;
		max-width: 150px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		transition: background 0.1s, color 0.1s;
	}

	.matrix .row-label.highlighted {
		background: rgba(96, 165, 250, 0.15);
		color: #60a5fa;
	}

	.matrix .row-label.clickable,
	.matrix .col-header.clickable {
		cursor: pointer;
	}

	.matrix .row-label.clickable:hover,
	.matrix .col-header.clickable:hover {
		background: rgba(96, 165, 250, 0.25);
		color: #60a5fa;
	}

	.matrix .row-label .verbose-label {
		font-family: inherit;
		display: block;
		max-width: 250px;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* Verbose mode adjustments */
	.matrix:has(.verbose-label) .col-header {
		max-width: 3rem;
	}

	.matrix:has(.verbose-label) .row-label {
		max-width: 250px;
	}

	.matrix-cell {
		background: #0f172a;
		cursor: pointer;
		min-width: 1.5rem;
		height: 1.5rem;
		transition: background 0.1s;
	}

	.matrix-cell:hover {
		background: #334155;
	}

	.matrix-cell.col-highlighted {
		background: rgba(34, 197, 94, 0.08);
	}

	.matrix-cell.row-highlighted {
		background: rgba(96, 165, 250, 0.08);
	}

	.matrix-cell.col-highlighted.row-highlighted {
		background: rgba(251, 191, 36, 0.2);
		outline: 1px solid rgba(251, 191, 36, 0.5);
		outline-offset: -1px;
	}

	.matrix-cell.linked {
		background: rgba(34, 197, 94, 0.2);
	}

	.matrix-cell.linked.col-highlighted,
	.matrix-cell.linked.row-highlighted {
		background: rgba(34, 197, 94, 0.3);
	}

	.matrix-cell.linked.col-highlighted.row-highlighted {
		background: rgba(34, 197, 94, 0.4);
		outline: 1px solid #22c55e;
	}

	.matrix-cell.linked:hover {
		background: rgba(34, 197, 94, 0.35);
	}

	/* Downstream transitive (row traces down to col) - blue */
	.matrix-cell.transitive-downstream {
		background: rgba(59, 130, 246, 0.15);
	}
	.matrix-cell.transitive-downstream.col-highlighted,
	.matrix-cell.transitive-downstream.row-highlighted {
		background: rgba(59, 130, 246, 0.25);
	}
	.matrix-cell.transitive-downstream.col-highlighted.row-highlighted {
		background: rgba(59, 130, 246, 0.35);
		outline: 1px solid #3b82f6;
	}
	.matrix-cell.transitive-downstream:hover {
		background: rgba(59, 130, 246, 0.3);
	}

	/* Upstream transitive (col traces down to row) - purple */
	.matrix-cell.transitive-upstream {
		background: rgba(168, 85, 247, 0.15);
	}
	.matrix-cell.transitive-upstream.col-highlighted,
	.matrix-cell.transitive-upstream.row-highlighted {
		background: rgba(168, 85, 247, 0.25);
	}
	.matrix-cell.transitive-upstream.col-highlighted.row-highlighted {
		background: rgba(168, 85, 247, 0.35);
		outline: 1px solid #a855f7;
	}
	.matrix-cell.transitive-upstream:hover {
		background: rgba(168, 85, 247, 0.3);
	}

	/* Sibling transitive (shared ancestor) - amber */
	.matrix-cell.transitive-sibling {
		background: rgba(245, 158, 11, 0.15);
	}
	.matrix-cell.transitive-sibling.col-highlighted,
	.matrix-cell.transitive-sibling.row-highlighted {
		background: rgba(245, 158, 11, 0.25);
	}
	.matrix-cell.transitive-sibling.col-highlighted.row-highlighted {
		background: rgba(245, 158, 11, 0.35);
		outline: 1px solid #f59e0b;
	}
	.matrix-cell.transitive-sibling:hover {
		background: rgba(245, 158, 11, 0.3);
	}

	/* showIf dependency (row depends on col) - cyan */
	.matrix-cell.showif-depends {
		background: rgba(6, 182, 212, 0.2);
	}
	.matrix-cell.showif-depends.col-highlighted,
	.matrix-cell.showif-depends.row-highlighted {
		background: rgba(6, 182, 212, 0.3);
	}
	.matrix-cell.showif-depends.col-highlighted.row-highlighted {
		background: rgba(6, 182, 212, 0.4);
		outline: 1px solid #06b6d4;
	}
	.matrix-cell.showif-depends:hover {
		background: rgba(6, 182, 212, 0.35);
	}

	/* showIf dependency (col depends on row) - lighter cyan */
	.matrix-cell.showif-depended {
		background: rgba(34, 211, 238, 0.15);
	}
	.matrix-cell.showif-depended.col-highlighted,
	.matrix-cell.showif-depended.row-highlighted {
		background: rgba(34, 211, 238, 0.25);
	}
	.matrix-cell.showif-depended.col-highlighted.row-highlighted {
		background: rgba(34, 211, 238, 0.35);
		outline: 1px solid #22d3ee;
	}
	.matrix-cell.showif-depended:hover {
		background: rgba(34, 211, 238, 0.3);
	}

	.cell-marker {
		font-size: 0.75rem;
	}

	.cell-marker.direct {
		color: #22c55e;
	}

	.cell-marker.showif {
		color: #06b6d4;
		font-weight: 600;
	}

	.cell-marker.transitive-downstream {
		color: #3b82f6;
		font-weight: 300;
	}

	.cell-marker.transitive-upstream {
		color: #a855f7;
		font-weight: 300;
	}

	.cell-marker.transitive-sibling {
		color: #f59e0b;
		font-weight: 300;
	}

	/* Trace View */
	.trace-view {
		display: flex;
		flex-direction: column;
		flex: 1;
		overflow: hidden;
	}

	.trace-toolbar {
		padding: 0.75rem 1rem;
		background: #1e293b;
		border-bottom: 1px solid #334155;
	}

	.trace-start-selector {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.trace-start-selector label {
		font-size: 0.8125rem;
		color: #94a3b8;
	}

	.trace-start-selector select {
		padding: 0.5rem 0.75rem;
		background: #0f172a;
		border: 1px solid #334155;
		border-radius: 0.375rem;
		color: #e2e8f0;
		font-size: 0.8125rem;
	}

	.trace-start-selector select:focus {
		outline: none;
		border-color: #60a5fa;
	}

	.trace-canvas {
		flex: 1;
		overflow: auto;
		padding: 1.5rem;
		background: #0f172a;
	}

	.trace-placeholder {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: #64748b;
		text-align: center;
	}

	.trace-placeholder p {
		margin: 0.5rem 0;
	}

	.trace-placeholder .hint {
		font-size: 0.8125rem;
		color: #475569;
	}

	.trace-flow {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		position: relative;
	}

	.trace-row {
		display: flex;
		flex-direction: column;
		margin-left: calc(var(--indent, 0) * 1.5rem);
		position: relative;
	}

	.trace-row::before {
		content: '';
		position: absolute;
		left: -1rem;
		top: 0.75rem;
		width: 0.75rem;
		height: 1px;
		background: #334155;
	}

	.trace-row:first-child::before {
		display: none;
	}

	.trace-node {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.5rem;
		background: #1e293b;
		border: 1px solid #334155;
		border-radius: 0.375rem;
		transition: all 0.15s ease;
		margin: 0.125rem 0;
	}

	.trace-node:hover {
		border-color: #475569;
	}

	.trace-collapse-btn {
		background: none;
		border: none;
		color: #64748b;
		cursor: pointer;
		padding: 0;
		width: 1rem;
		font-size: 0.625rem;
		transition: color 0.15s ease;
	}

	.trace-collapse-btn:hover {
		color: #94a3b8;
	}

	.trace-collapse-spacer {
		width: 1rem;
	}

	.trace-node-content {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.25rem;
		border-radius: 0.25rem;
		transition: background 0.15s ease;
	}

	.trace-node-content:hover {
		background: rgba(255, 255, 255, 0.05);
	}

	.trace-node.selected {
		border-color: #60a5fa;
		background: rgba(96, 165, 250, 0.15);
		box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.3);
	}

	.trace-node.selected .trace-node-content {
		background: transparent;
	}

	.trace-node.selected .trace-node-label {
		color: #fff;
	}

	.trace-node.question { border-left: 3px solid #60a5fa; }
	.trace-node.risk { border-left: 3px solid #f59e0b; }
	.trace-node.mitigation { border-left: 3px solid #10b981; }
	.trace-node.control { border-left: 3px solid #06b6d4; }
	.trace-node.regulation { border-left: 3px solid #a78bfa; }
	.trace-node.more { border-left: 3px solid #64748b; }

	.trace-node.placeholder {
		opacity: 0.6;
		cursor: default;
		font-style: italic;
	}
	.trace-node.placeholder:hover {
		background: #1e293b;
		border-color: #334155;
	}

	.trace-node-type {
		font-size: 0.625rem;
		font-weight: 600;
		width: 1.25rem;
		height: 1.25rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 3px;
		background: #0f172a;
	}

	.trace-node.question .trace-node-type { color: #60a5fa; }
	.trace-node.risk .trace-node-type { color: #f59e0b; }
	.trace-node.mitigation .trace-node-type { color: #10b981; }
	.trace-node.control .trace-node-type { color: #06b6d4; }
	.trace-node.regulation .trace-node-type { color: #a78bfa; }

	.trace-node-label {
		font-size: 0.8125rem;
		color: #e2e8f0;
		text-align: left;
	}

	.trace-children-count {
		font-size: 0.625rem;
		background: #334155;
		color: #94a3b8;
		padding: 0.125rem 0.375rem;
		border-radius: 0.75rem;
	}

	.trace-link-btn {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.125rem 0.375rem;
		background: rgba(96, 165, 250, 0.1);
		border: 1px solid rgba(96, 165, 250, 0.3);
		border-radius: 0.25rem;
		color: #60a5fa;
		font-size: 0.625rem;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.trace-link-btn:hover {
		background: rgba(96, 165, 250, 0.2);
		border-color: #60a5fa;
	}

	.trace-link-btn .link-icon {
		font-size: 0.75rem;
	}

	.trace-link-btn .link-text {
		text-transform: uppercase;
		font-weight: 500;
		letter-spacing: 0.02em;
	}

	.trace-children {
		display: flex;
		flex-direction: column;
		padding-left: 0.5rem;
		border-left: 1px dashed #334155;
		margin-left: 0.5rem;
	}

	.trace-stats {
		display: flex;
		gap: 1rem;
		margin-top: 1.5rem;
		padding-top: 1rem;
		border-top: 1px solid #334155;
	}

	.trace-stat {
		font-size: 0.75rem;
		color: #94a3b8;
		padding: 0.25rem 0.5rem;
		background: #1e293b;
		border-radius: 0.25rem;
	}

	.trace-stat.question { border-left: 2px solid #60a5fa; }
	.trace-stat.risk { border-left: 2px solid #f59e0b; }
	.trace-stat.mitigation { border-left: 2px solid #10b981; }
	.trace-stat.control { border-left: 2px solid #06b6d4; }
	.trace-stat.regulation { border-left: 2px solid #a78bfa; }

	/* showIf dependency display */
	.showif-summary {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		margin-top: 0.5rem;
	}

	.showif-condition {
		font-size: 0.75rem;
		background: rgba(6, 182, 212, 0.15);
		border: 1px solid rgba(6, 182, 212, 0.3);
		color: #06b6d4;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		font-family: monospace;
	}

	/* Graph View Toolbar */
	.graph-toolbar {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.5rem 0;
		border-bottom: 1px solid #334155;
	}

	.search {
		padding: 0.5rem 0.75rem;
		background: #1e293b;
		border: 1px solid #334155;
		border-radius: 0.375rem;
		color: #e2e8f0;
		font-size: 0.8125rem;
		width: 200px;
		margin-left: auto;
	}

	.search:focus { outline: none; border-color: #60a5fa; }

	.connection-banner {
		background: rgba(251, 191, 36, 0.2);
		border: 1px solid #fbbf24;
		padding: 0.5rem 1rem;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-size: 0.875rem;
		color: #fbbf24;
	}

	.connection-banner button {
		margin-left: auto;
		padding: 0.25rem 0.75rem;
		background: transparent;
		border: 1px solid #fbbf24;
		border-radius: 0.25rem;
		color: #fbbf24;
		cursor: pointer;
	}

	.help-banner {
		background: rgba(96, 165, 250, 0.1);
		border: 1px solid rgba(96, 165, 250, 0.3);
		padding: 0.5rem 1rem;
		font-size: 0.8125rem;
		color: #94a3b8;
	}

	.help-banner strong {
		color: #60a5fa;
	}

	.plus-hint {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.25rem;
		height: 1.25rem;
		background: #334155;
		border-radius: 50%;
		font-size: 0.875rem;
		color: #e2e8f0;
		margin: 0 0.125rem;
	}

	.layout {
		display: flex;
		flex: 1;
		overflow: hidden;
	}

	.columns {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		flex: 1;
		overflow: hidden;
	}

	.column {
		display: flex;
		flex-direction: column;
		border-right: 1px solid #334155;
		overflow: hidden;
	}

	.column:last-child { border-right: none; }

	.column-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 0.75rem;
		background: #1e293b;
		border-bottom: 1px solid #334155;
	}

	.column-icon {
		width: 1.75rem;
		height: 1.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 0.25rem;
		font-size: 0.875rem;
		font-weight: bold;
	}

	.questions .column-icon { background: rgba(96, 165, 250, 0.2); color: #60a5fa; }
	.risks .column-icon { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
	.mitigations .column-icon { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
	.regulations .column-icon { background: rgba(168, 85, 247, 0.2); color: #a855f7; }
	.controls .column-icon { background: rgba(249, 115, 22, 0.2); color: #f97316; }

	.column-header h2 {
		font-size: 0.875rem;
		color: #e2e8f0;
		flex: 1;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.count {
		font-size: 0.75rem;
		color: #64748b;
		background: #334155;
		padding: 0.1875rem 0.5rem;
		border-radius: 0.25rem;
	}

	.column-filters {
		padding: 0.375rem 0.75rem;
		border-bottom: 1px solid #334155;
	}

	.small-select {
		background: #1e293b;
		border: 1px solid #334155;
		border-radius: 4px;
		padding: 0.375rem 0.625rem;
		color: #e2e8f0;
		font-size: 0.75rem;
		width: 100%;
	}

	.node-meta {
		margin-top: 0.375rem;
		font-size: 0.6875rem;
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.node-meta .phases {
		color: #60a5fa;
	}

	.node-meta .subcategory {
		color: #22c55e;
		font-weight: 500;
	}

	.node-meta .control-count {
		color: #f97316;
	}

	/* Question dependency badges */
	.node-deps {
		display: flex;
		gap: 0.375rem;
		margin-top: 0.375rem;
	}

	.dep-badge {
		font-size: 0.625rem;
		padding: 0.125rem 0.375rem;
		border-radius: 0.1875rem;
		font-weight: 500;
	}

	.dep-badge.depends-on {
		background: rgba(251, 191, 36, 0.2);
		color: #fbbf24;
	}

	.dep-badge.depended-by {
		background: rgba(96, 165, 250, 0.2);
		color: #60a5fa;
	}

	.node.has-deps {
		border-left: 3px solid #fbbf24;
	}

	/* Connection indicator */
	.conn-indicator {
		display: block;
		font-size: 0.625rem;
		color: #fbbf24;
		margin-top: 0.25rem;
		font-style: italic;
	}

	.more-indicator {
		text-align: center;
		padding: 0.625rem;
		font-size: 0.75rem;
		color: #64748b;
		font-style: italic;
	}

	.conn-badge.transitive {
		background: rgba(249, 115, 22, 0.2);
		color: #f97316;
	}

	.nodes {
		flex: 1;
		overflow-y: auto;
		padding: 0.625rem;
	}

	.node {
		width: 100%;
		text-align: left;
		padding: 0.75rem;
		background: #0f172a;
		border: 1px solid #334155;
		border-radius: 0.375rem;
		margin-bottom: 0.5rem;
		cursor: pointer;
		position: relative;
		transition: all 0.15s;
	}

	.node:hover { border-color: #475569; }

	.node.question.selected { border-color: #60a5fa; background: rgba(96, 165, 250, 0.1); }
	.node.risk.selected { border-color: #ef4444; background: rgba(239, 68, 68, 0.1); }
	.node.mitigation.selected { border-color: #22c55e; background: rgba(34, 197, 94, 0.1); }
	.node.regulation.selected { border-color: #a855f7; background: rgba(168, 85, 247, 0.1); }
	.node.control.selected { border-color: #f97316; background: rgba(249, 115, 22, 0.1); }
	.node.control.connected { border-color: #f97316; opacity: 0.8; }

	.node.connected { opacity: 1; }
	.node:not(.selected):not(.connected) {
		opacity: 0.5;
	}
	.node:not(.selected):not(.connected):hover { opacity: 0.8; }

	/* When nothing selected, show all */
	.columns:not(:has(.node.selected)) .node { opacity: 1; }

	.node.connecting {
		border-color: #fbbf24 !important;
		background: rgba(251, 191, 36, 0.1) !important;
		opacity: 1 !important;
	}

	.node-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.25rem;
	}

	.node-id, .node-code {
		font-family: monospace;
		font-size: 0.75rem;
		padding: 0.1875rem 0.375rem;
		border-radius: 0.1875rem;
	}

	.question .node-id { background: rgba(96, 165, 250, 0.2); color: #60a5fa; }
	.risk .node-code { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
	.mitigation .node-code { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
	.regulation .node-code { background: rgba(168, 85, 247, 0.2); color: #a855f7; font-size: 0.6875rem; }

	.link-count {
		font-size: 0.6875rem;
		background: #475569;
		color: #e2e8f0;
		padding: 0.125rem 0.375rem;
		border-radius: 0.1875rem;
	}

	.conn-badge {
		font-size: 0.625rem;
		font-weight: 600;
		text-transform: uppercase;
		padding: 0.1875rem 0.375rem;
		border-radius: 0.1875rem;
	}

	.conn-badge.trigger { background: rgba(251, 191, 36, 0.3); color: #fbbf24; }
	.conn-badge.dependency { background: rgba(59, 130, 246, 0.3); color: #3b82f6; }
	.conn-badge.mitigation { background: rgba(34, 197, 94, 0.3); color: #22c55e; }
	.conn-badge.regulation { background: rgba(168, 85, 247, 0.3); color: #a855f7; }
	.conn-badge.control { background: rgba(249, 115, 22, 0.3); color: #f97316; }
	.conn-badge.implementation { background: rgba(236, 72, 153, 0.3); color: #ec4899; }
	.conn-badge.custom { background: rgba(148, 163, 184, 0.3); color: #94a3b8; }

	.edit-hint {
		font-size: 0.6875rem;
		color: #fbbf24;
		margin-top: 0.375rem;
		font-style: italic;
	}

	.focus-toggle {
		border: 1px solid #475569;
	}

	.focus-toggle.active {
		background: rgba(251, 191, 36, 0.2);
		border-color: #fbbf24;
		color: #fbbf24;
	}

	.node-text {
		font-size: 0.8125rem;
		color: #e2e8f0;
		line-height: 1.4;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.connect-btn {
		position: absolute;
		top: 0.375rem;
		right: 0.375rem;
		width: 1.25rem;
		height: 1.25rem;
		background: #334155;
		border: none;
		border-radius: 50%;
		color: #94a3b8;
		font-size: 0.875rem;
		cursor: pointer;
		opacity: 0;
		transition: opacity 0.15s;
	}

	.node:hover .connect-btn { opacity: 1; }
	.connect-btn:hover { background: #475569; color: #e2e8f0; }

	/* Detail Panel */
	.detail-panel {
		width: 320px;
		background: #1e293b;
		border-left: 1px solid #334155;
		padding: 1rem;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.detail-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.detail-type {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
	}

	.detail-type.question { background: rgba(96, 165, 250, 0.2); color: #60a5fa; }
	.detail-type.risk { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
	.detail-type.mitigation { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
	.detail-type.regulation { background: rgba(168, 85, 247, 0.2); color: #a855f7; }

	.detail-panel h3 {
		font-size: 1rem;
		color: #f1f5f9;
		line-height: 1.4;
	}

	.detail-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.meta-item {
		font-size: 0.6875rem;
		color: #94a3b8;
		background: #0f172a;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
	}

	.detail-options {
		font-size: 0.75rem;
		color: #94a3b8;
	}

	.option-tag {
		display: inline-block;
		margin: 0.25rem 0.25rem 0 0;
		padding: 0.125rem 0.375rem;
		background: #334155;
		border-radius: 0.25rem;
		color: #e2e8f0;
	}

	.detail-desc {
		font-size: 0.8125rem;
		color: #94a3b8;
		line-height: 1.5;
	}

	.detail-controls {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid #334155;
	}

	.detail-controls strong {
		font-size: 0.75rem;
		color: #94a3b8;
		text-transform: uppercase;
	}

	.controls-list {
		margin-top: 0.5rem;
		max-height: 200px;
		overflow-y: auto;
	}

	.control-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.375rem 0.5rem;
		margin-bottom: 0.25rem;
		background: #0f172a;
		border-radius: 0.25rem;
		font-size: 0.75rem;
	}

	.control-item .control-name {
		color: #e2e8f0;
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.control-item .control-phases {
		color: #60a5fa;
		font-size: 0.625rem;
		margin-left: 0.5rem;
	}

	.control-item.more {
		color: #64748b;
		font-style: italic;
	}

	/* Control detail panel styles */
	.detail-section {
		margin-top: 0.75rem;
	}

	.detail-section strong {
		font-size: 0.75rem;
		color: #94a3b8;
		display: block;
		margin-bottom: 0.375rem;
	}

	.category-badge {
		display: inline-block;
		font-size: 0.75rem;
		color: #22c55e;
		background: rgba(34, 197, 94, 0.1);
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
	}

	.phase-badges, .tech-badges {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
	}

	.phase-badge {
		font-size: 0.6875rem;
		background: rgba(96, 165, 250, 0.2);
		color: #60a5fa;
		padding: 0.1875rem 0.375rem;
		border-radius: 0.1875rem;
	}

	.tech-badge {
		font-size: 0.6875rem;
		background: rgba(249, 115, 22, 0.2);
		color: #f97316;
		padding: 0.1875rem 0.375rem;
		border-radius: 0.1875rem;
	}

	.edit-control, .edit-entity {
		width: 100%;
		margin-top: 1rem;
		background: rgba(249, 115, 22, 0.2);
		border-color: #f97316;
		color: #f97316;
	}

	.edit-control:hover, .edit-entity:hover {
		background: rgba(249, 115, 22, 0.3);
	}

	.connections-section h4 {
		font-size: 0.75rem;
		color: #94a3b8;
		text-transform: uppercase;
		margin-bottom: 0.5rem;
	}

	.no-connections {
		font-size: 0.75rem;
		color: #64748b;
		text-align: center;
		padding: 1rem;
		background: #0f172a;
		border-radius: 0.375rem;
	}

	.connection-list {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.connection-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem;
		background: #0f172a;
		border: 1px solid #334155;
		border-radius: 0.375rem;
		cursor: pointer;
		text-align: left;
	}

	.connection-item:hover { border-color: #475569; }

	.conn-type {
		font-size: 0.5625rem;
		font-weight: 600;
		text-transform: uppercase;
		padding: 0.125rem 0.25rem;
		border-radius: 0.125rem;
	}

	.conn-type.trigger { background: rgba(251, 191, 36, 0.2); color: #fbbf24; }
	.conn-type.dependency { background: rgba(59, 130, 246, 0.2); color: #3b82f6; }
	.conn-type.mitigation { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
	.conn-type.regulation { background: rgba(168, 85, 247, 0.2); color: #a855f7; }
	.conn-type.control { background: rgba(249, 115, 22, 0.2); color: #f97316; }
	.conn-type.implementation { background: rgba(236, 72, 153, 0.2); color: #ec4899; }
	.conn-type.custom { background: rgba(148, 163, 184, 0.2); color: #94a3b8; }

	.conn-direction {
		color: #64748b;
		font-size: 0.75rem;
	}

	.conn-target {
		flex: 1;
		font-size: 0.6875rem;
		color: #e2e8f0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.conn-target.question { color: #60a5fa; }
	.conn-target.risk { color: #ef4444; }
	.conn-target.mitigation { color: #22c55e; }
	.conn-target.regulation { color: #a855f7; }

	.conn-phases {
		font-size: 0.5625rem;
		color: #64748b;
	}

	.connect-action {
		width: 100%;
		margin-top: auto;
	}

	/* Buttons */
	.btn {
		padding: 0.5rem 1rem;
		background: #334155;
		border: none;
		border-radius: 0.375rem;
		color: #e2e8f0;
		font-size: 0.8125rem;
		cursor: pointer;
	}

	.btn:hover { background: #475569; }
	.btn.primary { background: #60a5fa; color: #0f172a; }
	.btn.primary:hover { background: #3b82f6; }
	.btn.danger { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
	.btn.danger:hover { background: rgba(239, 68, 68, 0.3); }
	.btn.danger-outline { background: transparent; border: 1px solid #ef4444; color: #ef4444; }
	.btn.danger-outline:hover { background: rgba(239, 68, 68, 0.1); }

	.status-badge {
		font-size: 0.6875rem;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		font-weight: 500;
	}

	.status-badge.local {
		background: rgba(251, 191, 36, 0.2);
		color: #fbbf24;
	}

	.status-badge.default {
		background: rgba(34, 197, 94, 0.2);
		color: #22c55e;
	}

	.close-btn {
		background: none;
		border: none;
		color: #64748b;
		font-size: 1.5rem;
		cursor: pointer;
	}

	.close-btn:hover { color: #e2e8f0; }

	/* Modal */
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 200;
	}

	.modal {
		background: #1e293b;
		border: 1px solid #334155;
		border-radius: 0.5rem;
		max-width: 600px;
		width: 90%;
		max-height: 80vh;
		display: flex;
		flex-direction: column;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		border-bottom: 1px solid #334155;
	}

	.modal-header h3 {
		font-size: 1rem;
		color: #f1f5f9;
	}

	.modal-body {
		flex: 1;
		padding: 1rem;
		overflow-y: auto;
	}

	.modal-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		border-top: 1px solid #334155;
	}

	.footer-right {
		display: flex;
		gap: 0.75rem;
	}

	.link-preview {
		display: flex;
		align-items: stretch;
		gap: 0.75rem;
		padding: 1rem;
		background: #0f172a;
		border-radius: 0.375rem;
		margin-bottom: 1rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	.link-node {
		font-size: 0.75rem;
		padding: 0.375rem 0.75rem;
		border-radius: 0.25rem;
		max-width: 150px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.link-node.question { background: rgba(96, 165, 250, 0.2); color: #60a5fa; }
	.link-node.risk { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
	.link-node.mitigation { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
	.link-node.regulation { background: rgba(168, 85, 247, 0.2); color: #a855f7; }

	.link-node-btn {
		font-size: 0.75rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.25rem;
		flex: 1;
		min-width: 120px;
		max-width: 250px;
		white-space: normal;
		line-height: 1.4;
		text-align: left;
		border: 1px solid transparent;
		cursor: pointer;
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		transition: all 0.15s;
	}

	.link-node-btn:hover {
		border-color: currentColor;
	}

	.link-node-btn.question { background: rgba(96, 165, 250, 0.2); color: #60a5fa; }
	.link-node-btn.risk { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
	.link-node-btn.mitigation { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
	.link-node-btn.regulation { background: rgba(168, 85, 247, 0.2); color: #a855f7; }

	.change-icon {
		font-size: 0.625rem;
		opacity: 0.5;
	}

	.link-node-btn:hover .change-icon {
		opacity: 1;
	}

	/* Entity Selector */
	.entity-selector {
		background: #0f172a;
		border: 1px solid #334155;
		border-radius: 0.5rem;
		margin-bottom: 1rem;
		overflow: hidden;
	}

	.entity-selector-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem;
		background: #1e293b;
		border-bottom: 1px solid #334155;
	}

	.selector-label {
		font-size: 0.8125rem;
		color: #e2e8f0;
		font-weight: 500;
	}

	.close-selector {
		background: none;
		border: none;
		color: #64748b;
		font-size: 1.25rem;
		cursor: pointer;
	}

	.close-selector:hover {
		color: #e2e8f0;
	}

	.entity-selector-toolbar {
		display: flex;
		gap: 0.5rem;
		padding: 0.5rem;
		background: #1e293b;
		border-bottom: 1px solid #334155;
	}

	.selector-search {
		flex: 1;
		padding: 0.5rem;
		background: #0f172a;
		border: 1px solid #334155;
		border-radius: 0.25rem;
		color: #e2e8f0;
		font-size: 0.8125rem;
	}

	.selector-search:focus {
		outline: none;
		border-color: #60a5fa;
	}

	.selector-sort {
		padding: 0.5rem;
		background: #0f172a;
		border: 1px solid #334155;
		border-radius: 0.25rem;
		color: #e2e8f0;
		font-size: 0.75rem;
	}

	.entity-selector-list {
		max-height: 250px;
		overflow-y: auto;
	}

	.entity-option {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.625rem 0.75rem;
		background: transparent;
		border: none;
		border-bottom: 1px solid #1e293b;
		cursor: pointer;
		text-align: left;
		transition: background 0.1s;
	}

	.entity-option:hover {
		background: #1e293b;
	}

	.entity-option.selected {
		background: rgba(96, 165, 250, 0.15);
	}

	.entity-option:last-child {
		border-bottom: none;
	}

	.entity-code {
		font-family: monospace;
		font-size: 0.625rem;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		flex-shrink: 0;
		min-width: 60px;
		text-align: center;
	}

	.entity-code.question { background: rgba(96, 165, 250, 0.2); color: #60a5fa; }
	.entity-code.risk { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
	.entity-code.mitigation { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
	.entity-code.regulation { background: rgba(168, 85, 247, 0.2); color: #a855f7; }

	.entity-name {
		flex: 1;
		font-size: 0.75rem;
		color: #e2e8f0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.entity-category {
		font-size: 0.625rem;
		color: #64748b;
		flex-shrink: 0;
	}

	.no-entities {
		padding: 1rem;
		text-align: center;
		color: #64748b;
		font-size: 0.8125rem;
	}

	.link-arrow { color: #64748b; font-size: 1.25rem; }

	.form-group {
		margin-bottom: 1rem;
	}

	.form-group label {
		display: block;
		font-size: 0.75rem;
		color: #94a3b8;
		margin-bottom: 0.375rem;
	}

	.form-group input, .form-group select, .form-group textarea {
		width: 100%;
		padding: 0.5rem;
		background: #0f172a;
		border: 1px solid #334155;
		border-radius: 0.375rem;
		color: #e2e8f0;
		font-size: 0.8125rem;
	}

	.form-group input:focus, .form-group select:focus, .form-group textarea:focus {
		outline: none;
		border-color: #60a5fa;
	}

	.phase-checkboxes, .answer-checkboxes {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.checkbox-group {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.checkbox-group.tech-types {
		max-height: 200px;
		overflow-y: auto;
		padding: 0.5rem;
		background: #0f172a;
		border: 1px solid #334155;
		border-radius: 0.375rem;
	}

	.checkbox-group .checkbox-label.all-types {
		width: 100%;
		padding-bottom: 0.5rem;
		margin-bottom: 0.5rem;
		border-bottom: 1px solid #334155;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.8125rem;
		color: #e2e8f0;
		cursor: pointer;
	}

	.checkbox-label input {
		width: auto;
	}

	.guidance-input {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.guidance-phase {
		font-size: 0.6875rem;
		font-weight: 600;
		color: #60a5fa;
		background: rgba(96, 165, 250, 0.2);
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		height: fit-content;
	}

	.guidance-input textarea {
		flex: 1;
	}

	@media (max-width: 1600px) {
		.columns {
			grid-template-columns: repeat(5, minmax(200px, 1fr));
			overflow-x: auto;
		}
		.node {
			padding: 0.625rem;
		}
		.node-text {
			font-size: 0.75rem;
		}
	}

	@media (max-width: 1200px) {
		.columns {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	@media (max-width: 800px) {
		.columns {
			grid-template-columns: 1fr;
		}

		.detail-panel {
			position: fixed;
			bottom: 0;
			left: 0;
			right: 0;
			height: 50%;
			width: 100%;
			border-left: none;
			border-top: 1px solid #334155;
		}
	}

	/* Entity Editor Modal */
	.entity-editor .modal-body {
		max-height: 60vh;
	}

	/* Show Conditions Editor */
	.show-conditions {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid #334155;
	}

	.show-conditions label .hint {
		font-weight: normal;
		color: #64748b;
		font-size: 0.75rem;
	}

	.no-conditions {
		color: #64748b;
		font-style: italic;
		font-size: 0.875rem;
		margin: 0.5rem 0;
	}

	.conditions-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin: 0.5rem 0;
	}

	.condition-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: #1e293b;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		flex-wrap: wrap;
	}

	.condition-question {
		color: #3b82f6;
		font-weight: 500;
		max-width: 200px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.condition-equals {
		color: #64748b;
	}

	.condition-values {
		color: #22c55e;
		font-weight: 500;
	}

	.remove-condition {
		margin-left: auto;
		background: transparent;
		border: none;
		color: #ef4444;
		font-size: 1.25rem;
		cursor: pointer;
		padding: 0 0.25rem;
		line-height: 1;
	}

	.remove-condition:hover {
		color: #f87171;
	}

	.add-condition {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-top: 0.75rem;
	}

	.add-condition select {
		width: 100%;
	}

	.condition-values-select {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-items: center;
		padding: 0.5rem;
		background: #1e293b;
		border-radius: 0.375rem;
	}

	.condition-values-select .when-label {
		color: #64748b;
		font-size: 0.75rem;
		width: 100%;
		margin-bottom: 0.25rem;
	}

	.condition-values-select .checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.875rem;
		color: #e2e8f0;
		cursor: pointer;
	}

	.condition-values-select .checkbox-label input[type="checkbox"] {
		width: auto;
		margin: 0;
	}

	.btn.small {
		padding: 0.375rem 0.75rem;
		font-size: 0.75rem;
		align-self: flex-start;
	}

	/* Phase Guidance Editor */
	.phase-guidance-section {
		margin-top: 1.5rem;
		padding-top: 1rem;
		border-top: 1px solid #334155;
	}

	.phase-guidance-section h4 {
		margin: 0 0 0.25rem 0;
		font-size: 0.9375rem;
		color: #e2e8f0;
	}

	.guidance-hint {
		font-size: 0.75rem;
		color: #64748b;
		margin: 0 0 1rem 0;
	}

	.phase-guidance-section textarea {
		font-size: 0.8125rem;
		line-height: 1.5;
	}

	.phase-tag {
		display: inline-block;
		font-size: 0.625rem;
		font-weight: 600;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		margin-left: 0.5rem;
		vertical-align: middle;
	}

	.phase-tag.p1 {
		background: #166534;
		color: #bbf7d0;
	}

	.phase-tag.p2 {
		background: #854d0e;
		color: #fef08a;
	}

	.phase-tag.p3 {
		background: #991b1b;
		color: #fecaca;
	}
</style>
