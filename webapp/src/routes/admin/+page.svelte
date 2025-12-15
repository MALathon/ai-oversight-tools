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
	// 5 entity types: questions, risks, subcategories (mitigation strategies), regulations, controls
	type EntityType = 'question' | 'risk' | 'subcategory' | 'regulation' | 'control';
	let matrixRowType = $state<EntityType>('question');
	let matrixColType = $state<EntityType>('risk');
	let matrixVerbose = $state(false);
	let matrixHoverRow = $state<string | null>(null);
	let matrixHoverCol = $state<string | null>(null);
	let showUnlinkedOnly = $state(false);
	let selectedIntersection = $state<{ rowType: EntityType; rowId: string; colType: EntityType; colId: string } | null>(null);

	// Determine link type for entity pair
	// Link types: trigger (Q→R), mitigation (R→S), control (R→C), regulation (R→Reg), dependency (Q→Q)
	function getLinkTypeForPair(fromType: EntityType, toType: EntityType): string | null {
		const pairs: Record<string, string> = {
			'question-risk': 'trigger',
			'risk-subcategory': 'mitigation',
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
			'mitigation': ['risk', 'subcategory'],
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
			: links.filter((l: any) => !l.phases || l.phases.length === 0 || l.phases.includes(selectedPhase))
	);

	// Compute which entities appear in phase-filtered links (for graph filtering)
	let linkedEntities = $derived.by(() => {
		const entities: Record<string, Set<string>> = {
			question: new Set(),
			risk: new Set(),
			subcategory: new Set(),
			regulation: new Set(),
			control: new Set()
		};
		for (const link of filteredLinks) {
			if (link.from.entity in entities) {
				entities[link.from.entity].add(link.from.id);
			}
			if (link.to.entity in entities) {
				entities[link.to.entity].add(link.to.id);
			}
		}
		return entities;
	});

	// traceGraph is defined after entity arrays (see below) to include all relationships

	// Get direct link between two entities using graph edge lookup (O(1))
	function getDirectLink(type1: EntityType, id1: string, type2: EntityType, id2: string): any {
		const key1 = `${type1}:${id1}`;
		const key2 = `${type2}:${id2}`;

		// Check edge in both directions
		const edgeKey1 = `${key1}->${key2}`;
		const edgeKey2 = `${key2}->${key1}`;

		if (traceGraph.hasEdge(edgeKey1)) {
			return traceGraph.getEdgeAttribute(edgeKey1, 'link');
		}
		if (traceGraph.hasEdge(edgeKey2)) {
			return traceGraph.getEdgeAttribute(edgeKey2, 'link');
		}
		return null;
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
			const rowQuestion = questionsById.get(rowId);
			const colQuestion = questionsById.get(colId);

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
			const dependentQ = questionsById.get(existing.dependentQuestion);
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
			const rowQ = questionsById.get(rowId);
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

		// Helper to get question dependencies (showIf) - not in graph, uses showIf property
		function getQuestionDependents(qId: string): string[] {
			const dependents: string[] = [];
			for (const [id, q] of questionsById) {
				if (q.showIf && qId in q.showIf) {
					dependents.push(id);
				}
			}
			return dependents;
		}

		// Helper to get outgoing edges of a specific type from a node (uses graph)
		function getOutgoingByType(nodeKey: string, linkType: string): Array<{ targetId: string; link: any }> {
			if (!traceGraph.hasNode(nodeKey)) return [];
			const results: Array<{ targetId: string; link: any }> = [];
			traceGraph.forEachOutEdge(nodeKey, (edge, attrs, source, target) => {
				const link = attrs.link;
				if (link.type === linkType) {
					results.push({ targetId: link.to.id, link });
				}
			});
			return results;
		}

		// Helper to get risks triggered by a question (uses graph)
		function getRisksForQuestion(qId: string): Array<{ risk: any; link: any }> {
			const nodeKey = `question:${qId}`;
			return getOutgoingByType(nodeKey, 'trigger')
				.map(({ targetId, link }) => ({ risk: risksById.get(targetId), link }))
				.filter(r => r.risk);
		}

		// Helper to get controls for a risk (uses graph)
		function getControlsForRisk(rId: string): Array<{ control: any; link: any }> {
			const nodeKey = `risk:${rId}`;
			return getOutgoingByType(nodeKey, 'control')
				.map(({ targetId, link }) => ({ control: controlsById.get(targetId), link }))
				.filter(c => c.control);
		}

		// Helper to get regulations for a risk (uses graph)
		function getRegulationsForRisk(rId: string): Array<{ regulation: any; link: any }> {
			const nodeKey = `risk:${rId}`;
			return getOutgoingByType(nodeKey, 'regulation')
				.map(({ targetId, link }) => ({ regulation: regulationsById.get(targetId), link }))
				.filter(r => r.regulation);
		}

		// Build question subtree (recursive for showIf dependencies)
		function buildQuestionNode(qId: string, depth: number, visited: Set<string>): TraceNode | null {
			if (visited.has(qId)) return null;
			visited.add(qId);

			const q = questionsById.get(qId);
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

		// Helper to get incoming edges of a specific type to a node (uses graph)
		function getIncomingByType(nodeKey: string, linkType: string): Array<{ sourceId: string; link: any }> {
			if (!traceGraph.hasNode(nodeKey)) return [];
			const results: Array<{ sourceId: string; link: any }> = [];
			traceGraph.forEachInEdge(nodeKey, (edge, attrs, source, target) => {
				const link = attrs.link;
				if (link.type === linkType) {
					results.push({ sourceId: link.from.id, link });
				}
			});
			return results;
		}

		// Start building tree based on start type
		if (traceStartType === 'question') {
			return buildQuestionNode(traceStartId, 0, new Set());
		} else if (traceStartType === 'risk') {
			const risk = risksById.get(traceStartId);
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
			const ctrl = controlsById.get(traceStartId);
			if (!ctrl) return null;

			const node: TraceNode = {
				type: 'control',
				id: ctrl.id,
				label: ctrl.name,
				shortLabel: ctrl.id.split('_')[0],
				children: [],
				depth: 0
			};

			// Find risks linked to this control (using graph incoming edges)
			const nodeKey = `control:${ctrl.id}`;
			const risksLinked = getIncomingByType(nodeKey, 'control')
				.map(({ sourceId, link }) => ({ risk: risksById.get(sourceId), link }))
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
	let entityType = $state<'questions' | 'risks' | 'subcategories' | 'regulations' | 'controls'>('risks');
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

	// Helper to get control subcategory by ID
	function getControlSubcategory(subcategoryId: string) {
		return data.controlSubcategories.find((s: any) => s.id === subcategoryId);
	}

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
		techTypes: c.techTypes || ['all'],
		implementationNotes: c.implementationNotes || {}
	})));

	// Use editable entities if modified, otherwise defaults
	let allQuestions = $derived(editableEntities.questions ?? defaultQuestions);
	let allRisks = $derived(editableEntities.risks ?? defaultRisks);
	let allRegulations = $derived(editableEntities.regulations ?? defaultRegulations);
	let allControls = $derived(editableEntities.controls ?? defaultControls);

	// Flatten subcategories from mitigation categories
	let allSubcategories = $derived(
		data.mitigationCategories.flatMap((cat: any) =>
			cat.strategies.map((s: any) => ({ ...s, categoryId: cat.id, categoryName: cat.name }))
		)
	);

	// Entity lookup Maps for O(1) access (replaces .find() calls)
	let questionsById = $derived(new Map(allQuestions.map(q => [q.id, q])));
	let risksById = $derived(new Map(allRisks.map(r => [r.id, r])));
	let regulationsById = $derived(new Map(allRegulations.map(r => [r.id, r])));
	let controlsById = $derived(new Map(allControls.map(c => [c.id, c])));
	let subcategoriesById = $derived(new Map(allSubcategories.map(s => [s.id, s])));

	// Build directed graph from ALL relationships using Graphology
	// Includes: explicit links + question dependencies (showIf) + control-subcategory relationships
	let traceGraph = $derived.by(() => {
		const graph = new Graph({ type: 'directed', multi: false, allowSelfLoops: false });

		// Helper to ensure node exists
		const ensureNode = (type: string, id: string) => {
			const key = `${type}:${id}`;
			if (!graph.hasNode(key)) {
				graph.addNode(key, { type, id });
			}
			return key;
		};

		// Helper to add edge if not exists
		const addEdge = (fromKey: string, toKey: string, link: any) => {
			const edgeKey = `${fromKey}->${toKey}`;
			if (!graph.hasEdge(edgeKey)) {
				graph.addEdgeWithKey(edgeKey, fromKey, toKey, { link });
			}
		};

		// 1. Add all explicit links from traceability data
		for (const link of filteredLinks) {
			const fromKey = ensureNode(link.from.entity, link.from.id);
			const toKey = ensureNode(link.to.entity, link.to.id);
			addEdge(fromKey, toKey, link);
		}

		// 2. Add question dependency edges (from showIf property)
		for (const question of allQuestions) {
			const questionKey = ensureNode('question', question.id);
			if (question.showIf) {
				for (const depId of Object.keys(question.showIf)) {
					const depKey = ensureNode('question', depId);
					// Edge: dependency → dependent (depId → question.id)
					addEdge(depKey, questionKey, {
						type: 'dependency',
						from: { entity: 'question', id: depId },
						to: { entity: 'question', id: question.id },
						_implicit: true
					});
				}
			}
		}

		// 3. Add control-subcategory edges (from subcategoryId property)
		for (const control of allControls) {
			if (control.subcategoryId) {
				const controlKey = ensureNode('control', control.id);
				const subcatKey = ensureNode('subcategory', control.subcategoryId);
				// Edge: subcategory → control (contains relationship)
				addEdge(subcatKey, controlKey, {
					type: 'contains',
					from: { entity: 'subcategory', id: control.subcategoryId },
					to: { entity: 'control', id: control.id },
					_implicit: true
				});
			}
		}

		return graph;
	});

	// CACHED GRAPH QUERIES - all derived from traceGraph, auto-update when graph changes

	// Link counts by entity (graph degree)
	let linkCountByEntity = $derived.by(() => {
		const counts = new Map<string, number>();
		traceGraph.forEachNode((nodeKey) => {
			counts.set(nodeKey, traceGraph.degree(nodeKey));
		});
		return counts;
	});

	// Controls by subcategory (from 'contains' edges: subcategory → control)
	let controlsBySubcategory = $derived.by(() => {
		const bySubcat = new Map<string, any[]>();
		// Query graph for all subcategory → control edges
		traceGraph.forEachNode((nodeKey) => {
			if (!nodeKey.startsWith('subcategory:')) return;
			const subcatId = nodeKey.split(':')[1];
			const controls: any[] = [];
			traceGraph.forEachOutEdge(nodeKey, (edge, attrs, source, target) => {
				if (target.startsWith('control:') && attrs.link?.type === 'contains') {
					const controlId = target.split(':')[1];
					const control = controlsById.get(controlId);
					if (control) controls.push(control);
				}
			});
			if (controls.length > 0) {
				bySubcat.set(subcatId, controls);
			}
		});
		return bySubcat;
	});

	// Question dependencies (from 'dependency' edges: question → question)
	let questionDependencies = $derived.by(() => {
		const deps = new Map<string, { dependsOn: string[], dependedBy: string[] }>();
		// Initialize all question nodes in graph
		traceGraph.forEachNode((nodeKey) => {
			if (!nodeKey.startsWith('question:')) return;
			const questionId = nodeKey.split(':')[1];
			const dependsOn: string[] = [];
			const dependedBy: string[] = [];

			// Incoming dependency edges = questions this one depends on
			traceGraph.forEachInEdge(nodeKey, (edge, attrs, source) => {
				if (source.startsWith('question:') && attrs.link?.type === 'dependency') {
					dependsOn.push(source.split(':')[1]);
				}
			});

			// Outgoing dependency edges = questions that depend on this one
			traceGraph.forEachOutEdge(nodeKey, (edge, attrs, source, target) => {
				if (target.startsWith('question:') && attrs.link?.type === 'dependency') {
					dependedBy.push(target.split(':')[1]);
				}
			});

			deps.set(questionId, { dependsOn, dependedBy });
		});
		return deps;
	});

	// Connections from selected node (recomputes when selectedNode changes)
	let connectionsToSelected = $derived.by(() => {
		const connections = new Map<string, any>();
		if (!selectedNode) return connections;
		const selectedKey = `${selectedNode.type}:${selectedNode.id}`;
		if (!traceGraph.hasNode(selectedKey)) return connections;

		traceGraph.forEachOutEdge(selectedKey, (edge, attrs, source, target) => {
			connections.set(target, attrs.link);
		});
		traceGraph.forEachInEdge(selectedKey, (edge, attrs, source, target) => {
			connections.set(source, attrs.link);
		});
		return connections;
	});

	// GUIDANCE ACCUMULATION - Traverse graph and collect metadata for LLM synthesis
	// Each entity type has different guidance properties:
	// - risks: phaseGuidance (risk context per phase)
	// - subcategories: phaseGuidance + phaseAppropriateness (strategy guidance + importance)
	// - controls: implementationNotes (implementation guidance per phase)
	// - questions: text (the question itself, for context)

	interface GuidanceNode {
		type: string;
		id: string;
		name: string;
		depth: number;
		edgeType?: string;
		// Phase-specific guidance
		guidance?: string;
		// Phase appropriateness (optional/recommended/essential)
		appropriateness?: string;
		// Source attribution
		source?: string;
		citation?: string;
		// Risk severity
		severity?: number;
		// Full entity for reference
		entity: any;
	}

	// Collect guidance along traversal paths from a starting node
	function collectGuidance(startType: string, startId: string, phase: string): GuidanceNode[] {
		const startKey = `${startType}:${startId}`;
		if (!traceGraph.hasNode(startKey)) return [];

		const accumulated: GuidanceNode[] = [];
		const visited = new Set<string>([startKey]);
		const queue: Array<{ nodeKey: string; depth: number; edgeType?: string }> = [
			{ nodeKey: startKey, depth: 0 }
		];

		while (queue.length > 0) {
			const { nodeKey, depth, edgeType } = queue.shift()!;
			const [type, id] = nodeKey.split(':');

			// Get entity data and extract guidance based on type
			let entity: any = null;
			let name = id;
			let guidance: string | undefined;
			let appropriateness: string | undefined;
			let source: string | undefined;
			let citation: string | undefined;
			let severity: number | undefined;

			if (type === 'risk') {
				entity = risksById.get(id);
				if (entity) {
					name = entity.shortName || entity.name;
					guidance = entity.phaseGuidance?.[phase];
					severity = entity.severity;
				}
			} else if (type === 'subcategory') {
				entity = subcategoriesById.get(id);
				if (entity) {
					name = entity.name;
					guidance = entity.phaseGuidance?.[phase];
					appropriateness = entity.phaseAppropriateness?.[phase];
				}
			} else if (type === 'control') {
				entity = controlsById.get(id);
				if (entity) {
					name = entity.name;
					guidance = entity.implementationNotes?.[phase];
					source = entity.source;
					citation = entity.citation;
				}
			} else if (type === 'question') {
				entity = questionsById.get(id);
				if (entity) {
					name = entity.text;
					// Questions don't have phase guidance, but their text provides context
				}
			} else if (type === 'regulation') {
				// Regulations from allRegulations (defined later)
				// For now, just use the ID as the name
				name = id;
			}

			accumulated.push({
				type,
				id,
				name,
				depth,
				edgeType,
				guidance,
				appropriateness,
				source,
				citation,
				severity,
				entity
			});

			// Traverse outbound edges
			traceGraph.forEachOutEdge(nodeKey, (edge, attrs, src, target) => {
				if (!visited.has(target)) {
					visited.add(target);
					queue.push({
						nodeKey: target,
						depth: depth + 1,
						edgeType: attrs.link?.type
					});
				}
			});

			// Traverse inbound edges (for bidirectional discovery)
			traceGraph.forEachInEdge(nodeKey, (edge, attrs, src, target) => {
				if (!visited.has(src)) {
					visited.add(src);
					queue.push({
						nodeKey: src,
						depth: depth + 1,
						edgeType: attrs.link?.type
					});
				}
			});
		}

		return accumulated;
	}

	// Collect regulations along traversal paths
	function collectRegulations(startType: string, startId: string): Array<{ id: string; citation: string; description: string; depth: number }> {
		const startKey = `${startType}:${startId}`;
		if (!traceGraph.hasNode(startKey)) return [];

		const regulations: Array<{ id: string; citation: string; description: string; depth: number }> = [];
		const visited = new Set<string>([startKey]);
		const queue: Array<{ nodeKey: string; depth: number }> = [{ nodeKey: startKey, depth: 0 }];

		while (queue.length > 0) {
			const { nodeKey, depth } = queue.shift()!;

			// Check outbound edges for regulation links
			traceGraph.forEachOutEdge(nodeKey, (edge, attrs, src, target) => {
				if (target.startsWith('regulation:')) {
					const regId = target.split(':')[1];
					// Find regulation in allRegulations (defined later in file)
					const reg = data.traceability.regulations?.find((r: any) => r.id === regId);
					if (reg && !regulations.some(r => r.id === regId)) {
						regulations.push({
							id: regId,
							citation: reg.citation,
							description: reg.description,
							depth: depth + 1
						});
					}
				}
				if (!visited.has(target)) {
					visited.add(target);
					queue.push({ nodeKey: target, depth: depth + 1 });
				}
			});

			traceGraph.forEachInEdge(nodeKey, (edge, attrs, src, target) => {
				if (src.startsWith('regulation:')) {
					const regId = src.split(':')[1];
					const reg = data.traceability.regulations?.find((r: any) => r.id === regId);
					if (reg && !regulations.some(r => r.id === regId)) {
						regulations.push({
							id: regId,
							citation: reg.citation,
							description: reg.description,
							depth: depth + 1
						});
					}
				}
				if (!visited.has(src)) {
					visited.add(src);
					queue.push({ nodeKey: src, depth: depth + 1 });
				}
			});
		}

		return regulations;
	}

	// Collect citations/sources along traversal paths
	function collectCitations(startType: string, startId: string): Array<{ controlId: string; controlName: string; source: string; citation: string; depth: number }> {
		const startKey = `${startType}:${startId}`;
		if (!traceGraph.hasNode(startKey)) return [];

		const citations: Array<{ controlId: string; controlName: string; source: string; citation: string; depth: number }> = [];
		const visited = new Set<string>([startKey]);
		const queue: Array<{ nodeKey: string; depth: number }> = [{ nodeKey: startKey, depth: 0 }];

		while (queue.length > 0) {
			const { nodeKey, depth } = queue.shift()!;

			// If this is a control node, extract its citation
			if (nodeKey.startsWith('control:')) {
				const controlId = nodeKey.split(':')[1];
				const control = controlsById.get(controlId);
				if (control?.source && !citations.some(c => c.controlId === controlId)) {
					citations.push({
						controlId,
						controlName: control.name,
						source: control.source,
						citation: control.citation || '',
						depth
					});
				}
			}

			traceGraph.forEachOutEdge(nodeKey, (edge, attrs, src, target) => {
				if (!visited.has(target)) {
					visited.add(target);
					queue.push({ nodeKey: target, depth: depth + 1 });
				}
			});

			traceGraph.forEachInEdge(nodeKey, (edge, attrs, src, target) => {
				if (!visited.has(src)) {
					visited.add(src);
					queue.push({ nodeKey: src, depth: depth + 1 });
				}
			});
		}

		return citations;
	}

	// Combined guidance collection for a node - ready for LLM synthesis
	function collectAllGuidanceForNode(type: string, id: string, phase: string) {
		return {
			phase,
			startNode: { type, id },
			guidance: collectGuidance(type, id, phase),
			regulations: collectRegulations(type, id),
			citations: collectCitations(type, id)
		};
	}

	// Reactive guidance for selected node (for trace view)
	let selectedNodeGuidance = $derived.by(() => {
		if (!traceSelectedNode) return null;
		const phase = selectedPhase === 'all' ? 'phase-1' : selectedPhase;
		return collectAllGuidanceForNode(traceSelectedNode.type, traceSelectedNode.id, phase);
	});

	// Reactive guidance for graph view selected node
	let graphSelectedNodeGuidance = $derived.by(() => {
		if (!selectedNode) return null;
		const phase = selectedPhase === 'all' ? 'phase-1' : selectedPhase;
		return collectAllGuidanceForNode(selectedNode.type, selectedNode.id, phase);
	});

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
		subcategory: {
			label: 'Subcategories',
			shortLabel: 'Sub',
			getAll: () => allSubcategories,
			getLabel: (s) => s.name,
			getShortLabel: (s) => s.code,
			searchText: (s) => s.name + ' ' + s.code + ' ' + s.description
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
					filtered = filtered.filter(c => !c.phases || c.phases.length === 0 || c.phases.includes(selectedPhase));
				}
				if (selectedTechType !== 'all') {
					filtered = filtered.filter(c => !c.techTypes || c.techTypes.includes('all') || c.techTypes.includes(selectedTechType));
				}
				return filtered.slice(0, 100); // Limit for performance
			},
			getLabel: (c) => c.name,
			getShortLabel: (c) => c.id.split('_')[0],
			searchText: (c) => `${c.name} ${c.id} ${c.description || ''} ${c.source || ''} ${c.subcategoryId || ''}`
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
	// Empty phases array = applies to all phases
	// Empty techTypes or includes 'all' = applies to all tech types
	let graphFilteredControls = $derived.by(() => {
		let filtered = allControls;
		if (selectedPhase !== 'all') {
			filtered = filtered.filter(c =>
				!c.phases || c.phases.length === 0 || c.phases.includes(selectedPhase)
			);
		}
		if (selectedTechType !== 'all') {
			filtered = filtered.filter(c =>
				!c.techTypes || c.techTypes.length === 0 || c.techTypes.includes('all') || c.techTypes.includes(selectedTechType)
			);
		}
		return filtered;
	});

	// Graph-filtered entities (by phase via links, and by search)
	let graphFilteredQuestions = $derived.by(() => {
		let filtered = filterBySearch(allQuestions, (q: any) => q.text, 'question');
		// When phase selected, only show questions that appear in filtered links
		if (selectedPhase !== 'all') {
			filtered = filtered.filter(q => linkedEntities.question.has(q.id));
		}
		return filtered;
	});

	let graphFilteredRisks = $derived.by(() => {
		let filtered = filterBySearch(allRisks, (r: any) => r.shortName + ' ' + r.name, 'risk');
		if (selectedPhase !== 'all') {
			filtered = filtered.filter(r => linkedEntities.risk.has(r.id));
		}
		return filtered;
	});

	let graphFilteredSubcategories = $derived.by(() => {
		let filtered = filterBySearch(allSubcategories, (s: any) => s.name + ' ' + s.code, 'subcategory');
		if (selectedPhase !== 'all') {
			filtered = filtered.filter(s => linkedEntities.subcategory.has(s.id));
		}
		return filtered;
	});

	let graphFilteredRegulations = $derived.by(() => {
		let filtered = filterBySearch(allRegulations, (r: any) => r.citation + ' ' + r.description, 'regulation');
		if (selectedPhase !== 'all') {
			filtered = filtered.filter(r => linkedEntities.regulation.has(r.id));
		}
		return filtered;
	});

	// Visible counts for graph columns (accounting for focus mode and transitive connections)
	let visibleQuestionCount = $derived.by(() => {
		if (!focusMode || !selectedNode) return graphFilteredQuestions.length;
		return graphFilteredQuestions.filter((q: any) => {
			const isSelected = selectedNode?.type === 'question' && selectedNode?.id === q.id;
			const connected = transitiveConnections.has(`question:${q.id}`);
			return isSelected || connected;
		}).length;
	});

	let visibleRiskCount = $derived.by(() => {
		if (!focusMode || !selectedNode) return graphFilteredRisks.length;
		return graphFilteredRisks.filter((r: any) => {
			const isSelected = selectedNode?.type === 'risk' && selectedNode?.id === r.id;
			const connected = transitiveConnections.has(`risk:${r.id}`);
			return isSelected || connected;
		}).length;
	});

	let visibleSubcategoryCount = $derived.by(() => {
		if (!focusMode || !selectedNode) return graphFilteredSubcategories.length;
		return graphFilteredSubcategories.filter((s: any) => {
			const isSelected = selectedNode?.type === 'subcategory' && selectedNode?.id === s.id;
			const connected = transitiveConnections.has(`subcategory:${s.id}`);
			return isSelected || connected;
		}).length;
	});

	let visibleRegulationCount = $derived.by(() => {
		if (!focusMode || !selectedNode) return graphFilteredRegulations.length;
		return graphFilteredRegulations.filter((r: any) => {
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

	// Get control link count (direct risk→control links) using GRAPH
	function getControlLinkCount(controlId: string): number {
		const nodeKey = `control:${controlId}`;
		if (!traceGraph.hasNode(nodeKey)) return 0;
		// Count incoming edges from risks (risk → control)
		let count = 0;
		traceGraph.forEachInEdge(nodeKey, (edge, attrs, source) => {
			if (source.startsWith('risk:')) count++;
		});
		return count;
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

	// Get connections for a node using GRAPH (all relationships now in graph)
	function getConnections(type: string, id: string) {
		const nodeKey = `${type}:${id}`;
		const linkConnections: any[] = [];

		if (traceGraph.hasNode(nodeKey)) {
			// Outgoing edges
			traceGraph.forEachOutEdge(nodeKey, (edge, attrs) => {
				linkConnections.push(attrs.link);
			});
			// Incoming edges
			traceGraph.forEachInEdge(nodeKey, (edge, attrs) => {
				linkConnections.push(attrs.link);
			});
		}

		return linkConnections;
	}

	// Get all transitively connected nodes from selected node using GRAPH TRAVERSAL
	// Graph now includes ALL relationships: explicit links + dependencies + control-subcategory
	let transitiveConnections = $derived.by(() => {
		if (!selectedNode) return new Set<string>();

		const connected = new Set<string>();
		const selectedKey = `${selectedNode.type}:${selectedNode.id}`;
		const selectedType = selectedNode.type;

		if (!traceGraph.hasNode(selectedKey)) {
			connected.add(selectedKey);
			return connected;
		}

		// Use BFS to find all connected nodes (both directions)
		const queue: string[] = [selectedKey];
		const visited = new Set<string>([selectedKey]);

		while (queue.length > 0) {
			const nodeKey = queue.shift()!;
			connected.add(nodeKey);

			// Traverse outgoing edges
			traceGraph.forEachOutEdge(nodeKey, (edge, attrs, source, target) => {
				if (!visited.has(target)) {
					visited.add(target);
					queue.push(target);
				}
			});

			// Traverse incoming edges
			traceGraph.forEachInEdge(nodeKey, (edge, attrs, source, target) => {
				if (!visited.has(source)) {
					visited.add(source);
					queue.push(source);
				}
			});
		}

		return connected;
	});

	// Check if node is connected to selected (including transitive)
	function isConnected(type: string, id: string): boolean {
		if (!selectedNode) return false;
		return transitiveConnections.has(`${type}:${id}`);
	}

	// Get connection to selected node (uses pre-computed connectionsToSelected for O(1) lookup)
	function getConnectionToSelected(type: string, id: string) {
		if (!selectedNode) return null;
		const nodeKey = `${type}:${id}`;
		return connectionsToSelected.get(nodeKey) ?? null;
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

	// Get entity display info (using Maps for O(1) lookup)
	function getQuestion(id: string) { return questionsById.get(id); }
	function getRisk(id: string) { return risksById.get(id); }
	function getRegulation(id: string) { return regulationsById.get(id); }
	function getControl(id: string) { return controlsById.get(id); }
	function getSubcategory(id: string) { return subcategoriesById.get(id); }
	function getControlCategory(id: string) { return controlCategories.find((s: any) => s.id === id); }

	// Get question dependencies (uses pre-computed questionDependencies for O(1) lookup)
	function getQuestionDependencies(questionId: string): { dependsOn: string[], dependedBy: string[] } {
		return questionDependencies.get(questionId) ?? { dependsOn: [], dependedBy: [] };
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

		const wasNew = isNewEntity;

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

		// If was new entity, stay open so user can add connections immediately
		if (wasNew) {
			isNewEntity = false; // Switch to edit mode - connections section will now show
			// Keep modal open
		} else {
			showEntityEditor = false;
			editingEntity = null;
		}
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

	// Count links for a node (uses pre-computed linkCountByEntity for O(1) lookup)
	function getLinkCount(type: string, id: string): number {
		const nodeKey = `${type}:${id}`;
		return linkCountByEntity.get(nodeKey) ?? 0;
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

	// Get intersection details for matrix view
	let intersectionDetails = $derived.by(() => {
		if (!selectedIntersection) return null;
		const { rowType, rowId, colType, colId } = selectedIntersection;

		// Get both entities (using Map lookups)
		const getEntity = (type: EntityType, id: string) => {
			if (type === 'question') return getQuestion(id);
			if (type === 'risk') return getRisk(id);
			if (type === 'subcategory') return getSubcategory(id);
			if (type === 'regulation') return getRegulation(id);
			if (type === 'control') return getControl(id);
			return null;
		};

		const rowEntity = getEntity(rowType, rowId);
		const colEntity = getEntity(colType, colId);

		// Get direct link between them
		const linkType = getLinkTypeForPair(rowType, colType);
		const directLink = linkType ? links.find((l: any) =>
			(l.from.entity === rowType && l.from.id === rowId && l.to.entity === colType && l.to.id === colId) ||
			(l.from.entity === colType && l.from.id === colId && l.to.entity === rowType && l.to.id === rowId)
		) : null;

		// Get downstream entities for each
		// Helper to get outgoing edges by type from graph
		const getOutEdgesByType = (nodeKey: string, linkType: string): any[] => {
			if (!traceGraph.hasNode(nodeKey)) return [];
			const results: any[] = [];
			traceGraph.forEachOutEdge(nodeKey, (edge, attrs) => {
				if (attrs.link.type === linkType) {
					results.push(attrs.link);
				}
			});
			return results;
		};

		const getDownstream = (type: EntityType, id: string) => {
			const downstream: Record<string, any[]> = {};
			const nodeKey = `${type}:${id}`;

			if (type === 'risk') {
				// Risk → Subcategories (using graph)
				const subcatLinks = getOutEdgesByType(nodeKey, 'mitigation');
				downstream.subcategories = subcatLinks.map((l: any) => subcategoriesById.get(l.to.id)).filter(Boolean);

				// Risk → Controls (direct, using graph)
				const controlLinks = getOutEdgesByType(nodeKey, 'control');
				downstream.controls = controlLinks.map((l: any) => controlsById.get(l.to.id)).filter(Boolean);

				// Risk → Regulations (using graph)
				const regLinks = getOutEdgesByType(nodeKey, 'regulation');
				downstream.regulations = regLinks.map((l: any) => regulationsById.get(l.to.id)).filter(Boolean);
			}

			if (type === 'subcategory') {
				// Subcategory → Controls (via subcategoryId index)
				downstream.controls = controlsBySubcategory.get(id) || [];
			}

			if (type === 'question') {
				// Question → Risks (triggers, using graph)
				const triggerLinks = getOutEdgesByType(nodeKey, 'trigger');
				downstream.risks = triggerLinks.map((l: any) => risksById.get(l.to.id)).filter(Boolean);
			}

			return downstream;
		};

		return {
			rowType,
			rowEntity,
			colType,
			colEntity,
			directLink,
			rowDownstream: getDownstream(rowType, rowId),
			colDownstream: getDownstream(colType, colId)
		};
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
			<div class="add-entity-dropdown">
				<button class="btn add-entity-btn">+ Add</button>
				<div class="add-dropdown-menu">
					<button onclick={() => { entityType = 'questions'; createNewEntity(); }}>Question</button>
					<button onclick={() => { entityType = 'risks'; createNewEntity(); }}>Risk</button>
					<button onclick={() => { entityType = 'subcategories'; createNewEntity(); }}>Subcategory</button>
					<button onclick={() => { entityType = 'regulations'; createNewEntity(); }}>Regulation</button>
					<button onclick={() => { entityType = 'controls'; createNewEntity(); }}>Control</button>
				</div>
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
										class:selected={selectedIntersection?.rowId === rowItem.id && selectedIntersection?.colId === colItem.id}
										onclick={() => { selectedIntersection = { rowType: matrixRowType, rowId: rowItem.id, colType: matrixColType, colId: colItem.id }; }}
										ondblclick={() => toggleGenericMatrixLink(matrixRowType, rowItem.id, matrixColType, colItem.id)}
										onmouseenter={() => { matrixHoverRow = rowItem.id; matrixHoverCol = colItem.id; }}
										title="Click to view details, double-click to toggle link"
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

		<!-- Intersection Details Panel -->
		{#if intersectionDetails}
			<div class="intersection-panel">
				<div class="intersection-header">
					<h3>Intersection Details</h3>
					<button class="close-btn" onclick={() => selectedIntersection = null}>×</button>
				</div>
				<div class="intersection-content">
					<!-- Row Entity -->
					<div class="entity-section">
						<div class="entity-header">
							<span class="entity-type-badge {intersectionDetails.rowType}">{intersectionDetails.rowType}</span>
							<span class="entity-name">{intersectionDetails.rowEntity?.name || intersectionDetails.rowEntity?.text || intersectionDetails.rowEntity?.shortName || 'Unknown'}</span>
						</div>
						{#if intersectionDetails.rowType === 'question' && intersectionDetails.rowEntity}
							<p class="entity-detail">{intersectionDetails.rowEntity.text}</p>
						{:else if intersectionDetails.rowType === 'risk' && intersectionDetails.rowEntity}
							<p class="entity-detail">{intersectionDetails.rowEntity.name}</p>
							{#if intersectionDetails.rowEntity.phaseGuidance}
								<div class="phase-guidance">
									<strong>Phase Guidance:</strong>
									{#each Object.entries(intersectionDetails.rowEntity.phaseGuidance) as [phase, text]}
										<div class="phase-item">
											<span class="phase-label">{phase.replace('phase-', 'P')}</span>
											<span class="phase-text">{text}</span>
										</div>
									{/each}
								</div>
							{/if}
						{:else if intersectionDetails.rowType === 'control' && intersectionDetails.rowEntity}
							<p class="entity-detail">{intersectionDetails.rowEntity.description}</p>
							{#if intersectionDetails.rowEntity.implementationNotes}
								<div class="impl-notes">
									<strong>Implementation Notes:</strong>
									{#each Object.entries(intersectionDetails.rowEntity.implementationNotes) as [phase, text]}
										<div class="phase-item">
											<span class="phase-label">{phase.replace('phase-', 'P')}</span>
											<span class="phase-text">{text}</span>
										</div>
									{/each}
								</div>
							{/if}
						{:else if intersectionDetails.rowEntity?.description}
							<p class="entity-detail">{intersectionDetails.rowEntity.description}</p>
						{/if}
					</div>

					<!-- Link Status -->
					<div class="link-section">
						<div class="link-indicator" class:linked={intersectionDetails.directLink}>
							{#if intersectionDetails.directLink}
								<span class="link-icon">✓</span> Linked ({intersectionDetails.directLink.type})
								{#if intersectionDetails.directLink.phases?.length}
									<span class="link-phases">Phases: {intersectionDetails.directLink.phases.map((p: string) => p.replace('phase-', 'P')).join(', ')}</span>
								{/if}
							{:else}
								<span class="link-icon">○</span> Not directly linked
							{/if}
						</div>
						<button class="btn small" onclick={() => toggleGenericMatrixLink(intersectionDetails.rowType, intersectionDetails.rowEntity?.id, intersectionDetails.colType, intersectionDetails.colEntity?.id)}>
							{intersectionDetails.directLink ? 'Edit Link' : 'Create Link'}
						</button>
					</div>

					<!-- Column Entity -->
					<div class="entity-section">
						<div class="entity-header">
							<span class="entity-type-badge {intersectionDetails.colType}">{intersectionDetails.colType}</span>
							<span class="entity-name">{intersectionDetails.colEntity?.name || intersectionDetails.colEntity?.text || intersectionDetails.colEntity?.shortName || 'Unknown'}</span>
						</div>
						{#if intersectionDetails.colType === 'question' && intersectionDetails.colEntity}
							<p class="entity-detail">{intersectionDetails.colEntity.text}</p>
						{:else if intersectionDetails.colType === 'risk' && intersectionDetails.colEntity}
							<p class="entity-detail">{intersectionDetails.colEntity.name}</p>
							{#if intersectionDetails.colEntity.phaseGuidance}
								<div class="phase-guidance">
									<strong>Phase Guidance:</strong>
									{#each Object.entries(intersectionDetails.colEntity.phaseGuidance) as [phase, text]}
										<div class="phase-item">
											<span class="phase-label">{phase.replace('phase-', 'P')}</span>
											<span class="phase-text">{text}</span>
										</div>
									{/each}
								</div>
							{/if}
						{:else if intersectionDetails.colType === 'control' && intersectionDetails.colEntity}
							<p class="entity-detail">{intersectionDetails.colEntity.description}</p>
							{#if intersectionDetails.colEntity.implementationNotes}
								<div class="impl-notes">
									<strong>Implementation Notes:</strong>
									{#each Object.entries(intersectionDetails.colEntity.implementationNotes) as [phase, text]}
										<div class="phase-item">
											<span class="phase-label">{phase.replace('phase-', 'P')}</span>
											<span class="phase-text">{text}</span>
										</div>
									{/each}
								</div>
							{/if}
						{:else if intersectionDetails.colEntity?.description}
							<p class="entity-detail">{intersectionDetails.colEntity.description}</p>
						{/if}
					</div>

					<!-- Downstream from Row -->
					{#if Object.keys(intersectionDetails.rowDownstream).length > 0}
						<div class="downstream-section">
							<h4>From {intersectionDetails.rowType}:</h4>
							{#each Object.entries(intersectionDetails.rowDownstream) as [type, items]}
								{#if items.length > 0}
									<div class="downstream-group">
										<span class="downstream-type">{type} ({items.length})</span>
										<ul class="downstream-list">
											{#each items.slice(0, 5) as item}
												<li>{item.name || item.shortName || item.text || item.citation || item.id}</li>
											{/each}
											{#if items.length > 5}
												<li class="more">...and {items.length - 5} more</li>
											{/if}
										</ul>
									</div>
								{/if}
							{/each}
						</div>
					{/if}

					<!-- Downstream from Column -->
					{#if Object.keys(intersectionDetails.colDownstream).length > 0}
						<div class="downstream-section">
							<h4>From {intersectionDetails.colType}:</h4>
							{#each Object.entries(intersectionDetails.colDownstream) as [type, items]}
								{#if items.length > 0}
									<div class="downstream-group">
										<span class="downstream-type">{type} ({items.length})</span>
										<ul class="downstream-list">
											{#each items.slice(0, 5) as item}
												<li>{item.name || item.shortName || item.text || item.citation || item.id}</li>
											{/each}
											{#if items.length > 5}
												<li class="more">...and {items.length - 5} more</li>
											{/if}
										</ul>
									</div>
								{/if}
							{/each}
						</div>
					{/if}
				</div>
			</div>
		{/if}

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
							if (t === 'question') return questionsById.get(id);
							if (t === 'risk') return risksById.get(id);
							if (t === 'control') return controlsById.get(id);
							if (t === 'regulation') return regulationsById.get(id);
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

								<!-- Accumulated Guidance from Graph Traversal -->
								{#if selectedNodeGuidance}
									{@const guidanceWithContent = selectedNodeGuidance.guidance.filter(g => g.guidance)}
									{@const essentialItems = guidanceWithContent.filter(g => g.appropriateness === 'essential')}
									{@const recommendedItems = guidanceWithContent.filter(g => g.appropriateness === 'recommended')}
									<div class="guidance-section">
										<h4>Guidance Trail ({selectedNodeGuidance.phase.replace('phase-', 'Phase ')})</h4>
										<p class="guidance-hint">Collected from {selectedNodeGuidance.guidance.length} connected nodes</p>

										{#if essentialItems.length > 0}
											<div class="guidance-group essential">
												<span class="guidance-label">Essential</span>
												{#each essentialItems as item}
													<div class="guidance-item">
														<span class="guidance-type {item.type}">{item.type}</span>
														<span class="guidance-name">{item.name}</span>
														<p class="guidance-text">{item.guidance}</p>
													</div>
												{/each}
											</div>
										{/if}

										{#if recommendedItems.length > 0}
											<div class="guidance-group recommended">
												<span class="guidance-label">Recommended</span>
												{#each recommendedItems as item}
													<div class="guidance-item">
														<span class="guidance-type {item.type}">{item.type}</span>
														<span class="guidance-name">{item.name}</span>
														<p class="guidance-text">{item.guidance}</p>
													</div>
												{/each}
											</div>
										{/if}

										{#if guidanceWithContent.filter(g => !g.appropriateness || g.appropriateness === 'optional').length > 0}
											<details class="guidance-group optional">
												<summary>Other Guidance ({guidanceWithContent.filter(g => !g.appropriateness || g.appropriateness === 'optional').length})</summary>
												{#each guidanceWithContent.filter(g => !g.appropriateness || g.appropriateness === 'optional') as item}
													<div class="guidance-item">
														<span class="guidance-type {item.type}">{item.type}</span>
														<span class="guidance-name">{item.name}</span>
														<p class="guidance-text">{item.guidance}</p>
														{#if item.source}
															<span class="guidance-source">{item.source}</span>
														{/if}
													</div>
												{/each}
											</details>
										{/if}

										{#if selectedNodeGuidance.regulations.length > 0}
											<details class="guidance-group regulations">
												<summary>Regulations ({selectedNodeGuidance.regulations.length})</summary>
												{#each selectedNodeGuidance.regulations as reg}
													<div class="guidance-item">
														<span class="guidance-citation">{reg.citation}</span>
														<p class="guidance-text">{reg.description}</p>
													</div>
												{/each}
											</details>
										{/if}

										{#if selectedNodeGuidance.citations.length > 0}
											<details class="guidance-group citations">
												<summary>Sources ({selectedNodeGuidance.citations.length})</summary>
												{#each selectedNodeGuidance.citations as cit}
													<div class="guidance-item">
														<span class="guidance-source">{cit.source}</span>
														{#if cit.citation}
															<span class="guidance-citation">{cit.citation}</span>
														{/if}
													</div>
												{/each}
											</details>
										{/if}
									</div>
								{/if}

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
					<button class="add-btn" title="Add Question" onclick={() => { entityType = 'questions'; createNewEntity(); }}>+</button>
				</div>
				<div class="nodes">
					{#each graphFilteredQuestions as q}
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
					<button class="add-btn" title="Add Risk" onclick={() => { entityType = 'risks'; createNewEntity(); }}>+</button>
				</div>
				<div class="nodes">
					{#each graphFilteredRisks as r}
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

			<!-- Subcategories Column (Mitigation Strategies) -->
			<div class="column subcategories">
				<div class="column-header">
					<span class="column-icon">▣</span>
					<h2>Subcategories</h2>
					<span class="count" title="{visibleSubcategoryCount} of {allSubcategories.length}">{visibleSubcategoryCount}</span>
					<button class="add-btn" title="Add Subcategory" onclick={() => { entityType = 'subcategories'; createNewEntity(); }}>+</button>
				</div>
				<div class="nodes">
					{#each graphFilteredSubcategories as s}
						{@const linkCount = getLinkCount('subcategory', s.id)}
						{@const controlCount = controlsBySubcategory.get(s.id)?.length ?? 0}
						{@const isSelected = selectedNode?.type === 'subcategory' && selectedNode?.id === s.id}
						{@const connected = isConnected('subcategory', s.id)}
						{@const connectionLink = getConnectionToSelected('subcategory', s.id)}
						{@const shouldHide = focusMode && selectedNode && !isSelected && !connected}
						{#if !shouldHide}
						<div
							class="node subcategory"
							class:selected={isSelected}
							class:connected
							class:connecting={connectingFrom?.type === 'subcategory' && connectingFrom?.id === s.id}
							role="button"
							tabindex="0"
							onclick={() => handleNodeClick('subcategory', s.id)}
							onkeydown={(e) => e.key === 'Enter' && handleNodeClick('subcategory', s.id)}
						>
							<div class="node-header">
								<span class="node-code">{s.code}</span>
								<span class="link-count" title="Risk links: {linkCount}, Controls: {controlCount}">{linkCount}/{controlCount}</span>
							</div>
							<div class="node-text">{s.name}</div>
							<div class="node-meta">
								<span class="category-badge">{s.categoryName?.split(' ')[0]}</span>
							</div>
							{#if connected && connectionLink}
								<span class="conn-indicator">{connectionLink.type}</span>
							{/if}
							<button class="connect-btn" title="Connect to..." onclick={(e) => startConnect('subcategory', s.id, e)}>+</button>
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
					<button class="add-btn" title="Add Regulation" onclick={() => { entityType = 'regulations'; createNewEntity(); }}>+</button>
				</div>
				<div class="nodes">
					{#each graphFilteredRegulations as r}
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
					<button class="add-btn" title="Add Control" onclick={() => { entityType = 'controls'; createNewEntity(); }}>+</button>
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
									{@const depQuestion = questionsById.get(questionId)}
									<div class="condition-item">
										<span class="condition-question">{depQuestion?.text || questionId}</span>
										<span class="condition-equals">=</span>
										<span class="condition-values">
											{#if Array.isArray(values)}
												{values.map(v => {
													const opt = depQuestion?.options?.find((o: any) => o.value === v);
													return opt?.label || v;
												}).join(' OR ')}
											{:else}
												{@const opt = depQuestion?.options?.find((o: any) => o.value === values)}
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
								{@const selectedQ = questionsById.get(newConditionQuestionId)}
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
						<span class="field-hint">No selection = applies to all phases</span>
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
					<div class="form-group">
						<label>Implementation Notes by Phase</label>
						<span class="field-hint">Protocol-ready text for each applicable phase</span>
						<div class="impl-notes-group">
							{#each phases as phase}
								{#if !editingEntity.phases?.length || editingEntity.phases?.includes(phase.id)}
									<div class="impl-note-item">
										<label class="impl-note-label">{phase.name}</label>
										<textarea
											rows="2"
											placeholder="Implementation guidance for {phase.name}..."
											value={editingEntity.implementationNotes?.[phase.id] || ''}
											oninput={(e) => {
												if (!editingEntity.implementationNotes) {
													editingEntity.implementationNotes = {};
												}
												editingEntity.implementationNotes[phase.id] = e.currentTarget.value;
											}}
										></textarea>
									</div>
								{/if}
							{/each}
						</div>
					</div>
				{/if}

				<!-- Connections Section (for existing entities) -->
				{#if !isNewEntity && editingEntity?.id}
					{@const entityConnections = getConnections(entityType.slice(0, -1), editingEntity.id)}
					<div class="connections-section-editor">
						<div class="connections-header">
							<h4>Connections ({entityConnections.length})</h4>
							<button
								class="btn small add-connection-btn"
								onclick={() => {
									// Create new link with this entity as source
									const eType = entityType.slice(0, -1) as EntityType;
									editingLink = {
										id: `link-${Date.now()}`,
										type: eType === 'question' ? 'trigger' : eType === 'risk' ? 'control' : 'control',
										from: { entity: eType, id: editingEntity.id },
										to: { entity: eType === 'question' ? 'risk' : 'control', id: '' },
										phases: ['phase-1', 'phase-2', 'phase-3'],
										answerValues: [],
										logic: 'OR',
										guidance: {}
									};
									showLinkEditor = true;
								}}
							>+ Add Connection</button>
						</div>
						{#if entityConnections.length === 0}
							<p class="no-connections-msg">No connections yet. Add one to link this {entityType.slice(0, -1)} to other entities.</p>
						{:else}
							<div class="connections-list-editor">
								{#each entityConnections as link}
									{@const isFrom = link.from.entity === entityType.slice(0, -1) && link.from.id === editingEntity.id}
									{@const otherEntity = isFrom ? link.to.entity : link.from.entity}
									{@const otherId = isFrom ? link.to.id : link.from.id}
									<div class="connection-row">
										<span class="conn-type-badge {link.type}">{link.type}</span>
										<span class="conn-direction">{isFrom ? '→' : '←'}</span>
										<span class="conn-other {otherEntity}">{getEntityName(otherEntity, otherId)}</span>
										{#if link.phases?.length}
											<span class="conn-phases-small">{link.phases.map((p: string) => p.replace('phase-', 'P')).join(',')}</span>
										{/if}
										<div class="conn-actions">
											<button
												class="conn-edit-btn"
												title="Edit connection"
												onclick={() => { editingLink = JSON.parse(JSON.stringify(link)); showLinkEditor = true; }}
											>Edit</button>
											<button
												class="conn-delete-btn"
												title="Delete connection"
												onclick={() => { links = links.filter((l: any) => l.id !== link.id); }}
											>×</button>
										</div>
									</div>
								{/each}
							</div>
						{/if}
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
					<button class="btn primary" onclick={saveEntity}>{isNewEntity ? 'Save' : 'Save & Close'}</button>
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
						} else if (editingLink.type === 'mitigation') {
							editingLink.from = { entity: 'risk', id: allRisks[0]?.id || '' };
							editingLink.to = { entity: 'subcategory', id: allSubcategories[0]?.id || '' };
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
						<option value="mitigation">Mitigation (Risk → Subcategory)</option>
						<option value="control">Control (Risk → Control)</option>
						<option value="regulation">Regulation (Risk → Regulation)</option>
					</select>
				</div>

				<div class="form-group">
					<label>Applicable Phases</label>
					<span class="field-hint">No selection = applies to all phases</span>
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

	.add-entity-dropdown {
		position: relative;
	}

	.add-entity-btn {
		background: #22c55e !important;
		color: white !important;
	}

	.add-entity-btn:hover {
		background: #16a34a !important;
	}

	.add-dropdown-menu {
		display: none;
		position: absolute;
		top: 100%;
		left: 0;
		background: #1e293b;
		border: 1px solid #334155;
		border-radius: 0.375rem;
		padding: 0.25rem;
		min-width: 120px;
		z-index: 100;
		box-shadow: 0 4px 12px rgba(0,0,0,0.3);
	}

	.add-entity-dropdown:hover .add-dropdown-menu,
	.add-entity-dropdown:focus-within .add-dropdown-menu {
		display: block;
	}

	.add-dropdown-menu button {
		display: block;
		width: 100%;
		padding: 0.5rem 0.75rem;
		background: transparent;
		border: none;
		color: #e2e8f0;
		text-align: left;
		font-size: 0.8125rem;
		cursor: pointer;
		border-radius: 0.25rem;
	}

	.add-dropdown-menu button:hover {
		background: #334155;
	}

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
		writing-mode: vertical-rl;
		text-orientation: mixed;
		max-height: 150px;
		overflow: hidden;
		text-overflow: ellipsis;
		font-size: 0.5625rem;
		line-height: 1.2;
		white-space: nowrap;
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
		max-width: 300px;
		overflow: hidden;
		text-overflow: ellipsis;
		font-size: 0.5625rem;
		line-height: 1.3;
		white-space: nowrap;
	}

	/* Verbose mode adjustments */
	.matrix:has(.verbose-label) .col-header {
		min-width: 1.75rem;
		max-width: 2rem;
		padding: 0.25rem;
	}

	.matrix:has(.verbose-label) .row-label {
		max-width: 300px;
		min-width: 200px;
	}

	.matrix:has(.verbose-label) .matrix-cell {
		min-width: 1.75rem;
		height: 1.25rem;
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

	.matrix-cell.selected {
		outline: 2px solid #f59e0b;
		outline-offset: -2px;
		background: rgba(251, 191, 36, 0.3);
	}

	/* Intersection Details Panel */
	.intersection-panel {
		position: fixed;
		right: 1rem;
		top: 5rem;
		width: 400px;
		max-height: calc(100vh - 6rem);
		background: #1e293b;
		border: 1px solid #334155;
		border-radius: 0.5rem;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
		z-index: 100;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.intersection-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1rem;
		background: #0f172a;
		border-bottom: 1px solid #334155;
	}

	.intersection-header h3 {
		margin: 0;
		font-size: 0.875rem;
		color: #f1f5f9;
	}

	.intersection-content {
		padding: 1rem;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.entity-section {
		background: #0f172a;
		border-radius: 0.375rem;
		padding: 0.75rem;
	}

	.entity-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.entity-type-badge {
		font-size: 0.625rem;
		text-transform: uppercase;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		font-weight: 600;
	}

	.entity-type-badge.question { background: #3b82f6; color: white; }
	.entity-type-badge.risk { background: #ef4444; color: white; }
	.entity-type-badge.subcategory { background: #8b5cf6; color: white; }
	.entity-type-badge.regulation { background: #f59e0b; color: white; }
	.entity-type-badge.control { background: #22c55e; color: white; }

	.entity-name {
		font-weight: 500;
		color: #e2e8f0;
		font-size: 0.8125rem;
	}

	.entity-detail {
		font-size: 0.75rem;
		color: #94a3b8;
		margin: 0;
		line-height: 1.4;
	}

	.phase-guidance, .impl-notes {
		margin-top: 0.5rem;
		font-size: 0.75rem;
	}

	.phase-guidance strong, .impl-notes strong {
		color: #94a3b8;
		display: block;
		margin-bottom: 0.25rem;
	}

	.phase-item {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 0.25rem;
		padding: 0.25rem;
		background: rgba(0, 0, 0, 0.2);
		border-radius: 0.25rem;
	}

	.phase-label {
		font-weight: 600;
		color: #60a5fa;
		min-width: 1.5rem;
	}

	.phase-text {
		color: #cbd5e1;
		line-height: 1.3;
	}

	.link-section {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 0.75rem;
		background: #0f172a;
		border-radius: 0.375rem;
		border: 1px dashed #334155;
	}

	.link-indicator {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.75rem;
		color: #94a3b8;
	}

	.link-indicator.linked {
		color: #22c55e;
	}

	.link-icon {
		font-size: 1rem;
	}

	.link-phases {
		font-size: 0.625rem;
		background: #334155;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		margin-left: 0.5rem;
	}

	.downstream-section {
		background: #0f172a;
		border-radius: 0.375rem;
		padding: 0.75rem;
	}

	.downstream-section h4 {
		margin: 0 0 0.5rem 0;
		font-size: 0.75rem;
		color: #94a3b8;
		text-transform: uppercase;
	}

	.downstream-group {
		margin-bottom: 0.5rem;
	}

	.downstream-type {
		font-size: 0.6875rem;
		color: #60a5fa;
		font-weight: 500;
	}

	.downstream-list {
		margin: 0.25rem 0 0 1rem;
		padding: 0;
		font-size: 0.6875rem;
		color: #cbd5e1;
	}

	.downstream-list li {
		margin-bottom: 0.125rem;
	}

	.downstream-list li.more {
		color: #64748b;
		font-style: italic;
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
	.subcategories .column-icon { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
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

	.add-btn {
		width: 1.5rem;
		height: 1.5rem;
		border-radius: 50%;
		background: #334155;
		color: #94a3b8;
		border: none;
		font-size: 1rem;
		font-weight: bold;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.15s;
		margin-left: auto;
	}

	.add-btn:hover {
		background: #3b82f6;
		color: white;
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
	.node.subcategory.selected { border-color: #22c55e; background: rgba(34, 197, 94, 0.1); }
	.node.regulation.selected { border-color: #a855f7; background: rgba(168, 85, 247, 0.1); }
	.node.control.selected { border-color: #f97316; background: rgba(249, 115, 22, 0.1); }
	.node.control.connected { border-color: #f97316; opacity: 0.8; }
	.node.subcategory.connected { border-color: #22c55e; opacity: 0.8; }

	.node.connected { opacity: 1; }

	.category-badge {
		font-size: 0.6rem;
		padding: 0.125rem 0.25rem;
		background: rgba(34, 197, 94, 0.2);
		color: #22c55e;
		border-radius: 0.25rem;
	}
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

	/* Guidance Section - accumulated from graph traversal */
	.guidance-section {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid #334155;
	}

	.guidance-section h4 {
		font-size: 0.75rem;
		color: #94a3b8;
		text-transform: uppercase;
		margin-bottom: 0.25rem;
	}

	.guidance-hint {
		font-size: 0.6875rem;
		color: #64748b;
		margin-bottom: 0.75rem;
	}

	.guidance-group {
		margin-bottom: 0.75rem;
		padding: 0.5rem;
		border-radius: 0.375rem;
		background: #0f172a;
	}

	.guidance-group.essential {
		border-left: 3px solid #ef4444;
	}

	.guidance-group.recommended {
		border-left: 3px solid #fbbf24;
	}

	.guidance-group.optional {
		border-left: 3px solid #64748b;
	}

	.guidance-group.regulations {
		border-left: 3px solid #a855f7;
	}

	.guidance-group.citations {
		border-left: 3px solid #3b82f6;
	}

	.guidance-label {
		display: block;
		font-size: 0.625rem;
		font-weight: 600;
		text-transform: uppercase;
		color: #94a3b8;
		margin-bottom: 0.5rem;
	}

	.guidance-group summary {
		font-size: 0.6875rem;
		color: #94a3b8;
		cursor: pointer;
		padding: 0.25rem 0;
	}

	.guidance-group summary:hover {
		color: #e2e8f0;
	}

	.guidance-item {
		padding: 0.5rem 0;
		border-bottom: 1px solid #1e293b;
	}

	.guidance-item:last-child {
		border-bottom: none;
	}

	.guidance-type {
		display: inline-block;
		font-size: 0.5625rem;
		font-weight: 600;
		text-transform: uppercase;
		padding: 0.125rem 0.25rem;
		border-radius: 0.125rem;
		margin-right: 0.5rem;
	}

	.guidance-type.risk { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
	.guidance-type.subcategory { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
	.guidance-type.control { background: rgba(249, 115, 22, 0.2); color: #f97316; }
	.guidance-type.question { background: rgba(96, 165, 250, 0.2); color: #60a5fa; }

	.guidance-name {
		font-size: 0.75rem;
		color: #e2e8f0;
		font-weight: 500;
	}

	.guidance-text {
		font-size: 0.6875rem;
		color: #94a3b8;
		margin: 0.25rem 0 0;
		line-height: 1.4;
	}

	.guidance-source {
		display: inline-block;
		font-size: 0.5625rem;
		color: #64748b;
		margin-top: 0.25rem;
	}

	.guidance-citation {
		display: block;
		font-size: 0.6875rem;
		color: #a855f7;
		font-weight: 500;
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

	/* Connections Section in Entity Editor */
	.connections-section-editor {
		margin-top: 1.5rem;
		padding-top: 1rem;
		border-top: 1px solid #334155;
	}

	.connections-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
	}

	.connections-header h4 {
		margin: 0;
		font-size: 0.875rem;
		color: #e2e8f0;
	}

	.add-connection-btn {
		font-size: 0.75rem;
		padding: 0.25rem 0.5rem;
	}

	.no-connections-msg {
		color: #64748b;
		font-size: 0.8125rem;
		font-style: italic;
	}

	.connections-list-editor {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		max-height: 200px;
		overflow-y: auto;
	}

	.connection-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem;
		background: #1e293b;
		border-radius: 0.375rem;
		font-size: 0.8125rem;
	}

	.conn-type-badge {
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
	}

	.conn-type-badge.trigger { background: rgba(96, 165, 250, 0.2); color: #60a5fa; }
	.conn-type-badge.control { background: rgba(249, 115, 22, 0.2); color: #f97316; }
	.conn-type-badge.regulation { background: rgba(168, 85, 247, 0.2); color: #a855f7; }
	.conn-type-badge.dependency { background: rgba(148, 163, 184, 0.2); color: #94a3b8; }

	.conn-direction {
		color: #64748b;
	}

	.conn-other {
		flex: 1;
		color: #e2e8f0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.conn-other.question { color: #60a5fa; }
	.conn-other.risk { color: #ef4444; }
	.conn-other.regulation { color: #a855f7; }
	.conn-other.control { color: #f97316; }

	.conn-phases-small {
		color: #64748b;
		font-size: 0.6875rem;
	}

	.conn-actions {
		display: flex;
		gap: 0.25rem;
	}

	.conn-edit-btn {
		padding: 0.125rem 0.375rem;
		background: #334155;
		border: none;
		border-radius: 0.25rem;
		color: #94a3b8;
		font-size: 0.6875rem;
		cursor: pointer;
	}

	.conn-edit-btn:hover {
		background: #475569;
		color: #e2e8f0;
	}

	.conn-delete-btn {
		padding: 0.125rem 0.375rem;
		background: transparent;
		border: none;
		color: #64748b;
		font-size: 0.875rem;
		cursor: pointer;
	}

	.conn-delete-btn:hover {
		color: #ef4444;
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

	.field-hint {
		display: block;
		font-size: 0.7rem;
		color: #64748b;
		font-style: italic;
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

	.impl-notes-group {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-top: 0.5rem;
	}

	.impl-note-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.impl-note-label {
		font-size: 0.75rem;
		font-weight: 500;
		color: #94a3b8;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.impl-notes-group textarea {
		font-size: 0.8125rem;
		line-height: 1.4;
		resize: vertical;
		min-height: 50px;
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
