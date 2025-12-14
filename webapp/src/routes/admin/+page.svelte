<script lang="ts">
	import { browser } from '$app/environment';
	import type { PageData } from './$types';

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
	let currentView = $state<'matrix' | 'risk-editor' | 'graph' | 'entities'>('matrix');
	let selectedPhase = $state<string>('all');
	let selectedTechType = $state<string>('all');
	let selectedNode = $state<{ type: string; id: string } | null>(null);
	let connectingFrom = $state<{ type: string; id: string } | null>(null);
	let showLinkEditor = $state(false);
	let editingLink = $state<any>(null);
	let searchQuery = $state('');
	let focusMode = $state(false);

	// Matrix view state
	let matrixType = $state<'triggers' | 'mitigations' | 'regulations' | 'controls'>('triggers');
	let matrixVerbose = $state(false);
	let matrixHoverRow = $state<string | null>(null);
	let matrixHoverCol = $state<string | null>(null);
	let showUnlinkedOnly = $state(false);

	// Get hover info for matrix
	let matrixHoverInfo = $derived.by(() => {
		if (!matrixHoverRow && !matrixHoverCol) return null;

		let rowInfo = '';
		let colInfo = '';

		if (matrixType === 'triggers') {
			if (matrixHoverRow) {
				const q = allQuestions.find(q => q.id === matrixHoverRow);
				rowInfo = q ? `${q.id}: ${q.text}` : matrixHoverRow;
			}
			if (matrixHoverCol) {
				const r = allRisks.find(r => r.id === matrixHoverCol);
				colInfo = r ? `${r.code}: ${r.shortName}` : matrixHoverCol;
			}
		} else if (matrixType === 'mitigations') {
			if (matrixHoverRow) {
				const r = allRisks.find(r => r.id === matrixHoverRow);
				rowInfo = r ? `${r.code}: ${r.shortName}` : matrixHoverRow;
			}
			if (matrixHoverCol) {
				const m = allMitigations.find(m => m.id === matrixHoverCol);
				colInfo = m ? `${m.code}: ${m.name}` : matrixHoverCol;
			}
		} else if (matrixType === 'regulations') {
			if (matrixHoverRow) {
				const r = allRisks.find(r => r.id === matrixHoverRow);
				rowInfo = r ? `${r.code}: ${r.shortName}` : matrixHoverRow;
			}
			if (matrixHoverCol) {
				const reg = allRegulations.find(r => r.id === matrixHoverCol);
				colInfo = reg ? `${reg.citation}: ${reg.description}` : matrixHoverCol;
			}
		}

		return { row: rowInfo, col: colInfo };
	});

	// Risk editor state
	let selectedRiskId = $state<string | null>(null);
	let selectedRisk = $derived(selectedRiskId ? getRisk(selectedRiskId) : null);

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

	// Control categories = AIHSR mitigation strategies = MIT subcategories
	// These are derived from control subcategories, not separately editable
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
	let allMitigations = $derived(controlCategories); // Alias: mitigations = control categories
	let allRegulations = $derived(editableEntities.regulations ?? defaultRegulations);
	let allControls = $derived(editableEntities.controls ?? defaultControls);

	// Link counts for orphan detection
	let linkCounts = $derived.by(() => {
		const counts = {
			questionTriggers: new Map<string, number>(),
			riskTriggers: new Map<string, number>(),
			riskMitigations: new Map<string, number>(),
			mitigationRisks: new Map<string, number>(),
			riskRegulations: new Map<string, number>(),
			regulationRisks: new Map<string, number>()
		};

		// Initialize all counts to 0
		allQuestions.forEach(q => counts.questionTriggers.set(q.id, 0));
		allRisks.forEach(r => {
			counts.riskTriggers.set(r.id, 0);
			counts.riskMitigations.set(r.id, 0);
			counts.riskRegulations.set(r.id, 0);
		});
		allMitigations.forEach(m => counts.mitigationRisks.set(m.id, 0));
		allRegulations.forEach(r => counts.regulationRisks.set(r.id, 0));

		// Count links
		links.forEach((link: any) => {
			if (link.type === 'trigger') {
				const qId = link.from?.id;
				const rId = link.to?.id;
				if (qId) counts.questionTriggers.set(qId, (counts.questionTriggers.get(qId) || 0) + 1);
				if (rId) counts.riskTriggers.set(rId, (counts.riskTriggers.get(rId) || 0) + 1);
			} else if (link.type === 'mitigation') {
				const rId = link.from?.id;
				const mId = link.to?.id;
				if (rId) counts.riskMitigations.set(rId, (counts.riskMitigations.get(rId) || 0) + 1);
				if (mId) counts.mitigationRisks.set(mId, (counts.mitigationRisks.get(mId) || 0) + 1);
			} else if (link.type === 'regulation') {
				const rId = link.from?.id;
				const regId = link.to?.id;
				if (rId) counts.riskRegulations.set(rId, (counts.riskRegulations.get(rId) || 0) + 1);
				if (regId) counts.regulationRisks.set(regId, (counts.regulationRisks.get(regId) || 0) + 1);
			}
		});

		return counts;
	});

	// Get orphan counts for display
	let orphanStats = $derived.by(() => {
		const stats = { rows: 0, cols: 0, total: 0 };
		if (matrixType === 'triggers') {
			allQuestions.forEach(q => { if ((linkCounts.questionTriggers.get(q.id) || 0) === 0) stats.rows++; });
			allRisks.forEach(r => { if ((linkCounts.riskTriggers.get(r.id) || 0) === 0) stats.cols++; });
		} else if (matrixType === 'mitigations') {
			allRisks.forEach(r => { if ((linkCounts.riskMitigations.get(r.id) || 0) === 0) stats.rows++; });
			allMitigations.forEach(m => { if ((linkCounts.mitigationRisks.get(m.id) || 0) === 0) stats.cols++; });
		} else if (matrixType === 'regulations') {
			allRisks.forEach(r => { if ((linkCounts.riskRegulations.get(r.id) || 0) === 0) stats.rows++; });
			allRegulations.forEach(r => { if ((linkCounts.regulationRisks.get(r.id) || 0) === 0) stats.cols++; });
		}
		stats.total = stats.rows + stats.cols;
		return stats;
	});

	// Filter links by phase
	let filteredLinks = $derived(
		selectedPhase === 'all'
			? links
			: links.filter((l: any) => !l.phases || l.phases.includes(selectedPhase))
	);

	// Get connections for a node
	function getConnections(type: string, id: string) {
		return filteredLinks.filter((l: any) =>
			(l.from.entity === type && l.from.id === id) ||
			(l.to.entity === type && l.to.id === id)
		);
	}

	// Check if node is connected to selected and get the link
	function isConnected(type: string, id: string): boolean {
		if (!selectedNode) return false;
		return filteredLinks.some((l: any) =>
			(l.from.entity === selectedNode.type && l.from.id === selectedNode.id && l.to.entity === type && l.to.id === id) ||
			(l.to.entity === selectedNode.type && l.to.id === selectedNode.id && l.from.entity === type && l.from.id === id) ||
			(l.from.entity === type && l.from.id === id && l.to.entity === selectedNode.type && l.to.id === selectedNode.id) ||
			(l.to.entity === type && l.to.id === id && l.from.entity === selectedNode.type && l.from.id === selectedNode.id)
		);
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
					// Determine link type based on node types
					let linkType = 'custom';
					if (connectingFrom.type === 'question' && type === 'risk') linkType = 'trigger';
					else if (connectingFrom.type === 'risk' && type === 'question') linkType = 'trigger';
					else if ((connectingFrom.type === 'risk' && type === 'mitigation') || (connectingFrom.type === 'mitigation' && type === 'risk')) linkType = 'mitigation';
					else if ((connectingFrom.type === 'risk' && type === 'regulation') || (connectingFrom.type === 'regulation' && type === 'risk')) linkType = 'regulation';

					const fromNode = connectingFrom.type === 'question' || connectingFrom.type === 'risk' ? connectingFrom : { type, id };
					const toNode = connectingFrom.type === 'question' || connectingFrom.type === 'risk' ? { type, id } : connectingFrom;

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
	function getMitigation(id: string) { return allMitigations.find(m => m.id === id); }
	function getRegulation(id: string) { return allRegulations.find(r => r.id === id); }
	function getControl(id: string) { return allControls.find(c => c.id === id); }
	function getControlSubcategory(id: string) { return data.controlSubcategories.find((s: any) => s.id === id); }

	// Get available entities for selector based on link type and position
	function getSelectableEntities(position: 'from' | 'to', linkType: string) {
		if (linkType === 'trigger') {
			if (position === 'from') return allQuestions.map(q => ({ id: q.id, name: q.text, code: q.id, category: q.category, type: 'question' }));
			else return allRisks.map(r => ({ id: r.id, name: r.shortName, code: r.code, category: r.domain, type: 'risk' }));
		} else if (linkType === 'mitigation') {
			if (position === 'from') return allRisks.map(r => ({ id: r.id, name: r.shortName, code: r.code, category: r.domain, type: 'risk' }));
			else return allMitigations.map(m => ({ id: m.id, name: m.name, code: m.code, category: m.category, type: 'mitigation' }));
		} else if (linkType === 'regulation') {
			if (position === 'from') return allRisks.map(r => ({ id: r.id, name: r.shortName, code: r.code, category: r.domain, type: 'risk' }));
			else return allRegulations.map(r => ({ id: r.id, name: r.description, code: r.citation, category: r.framework, type: 'regulation' }));
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

	// Risk editor picker state
	let showRiskPicker = $state<'trigger' | 'mitigation' | 'regulation' | null>(null);
	let riskPickerSearch = $state('');
	let pickerCreateMode = $state(false);
	let pickerNewEntity = $state<any>(null);

	// Initialize new entity for picker creation
	function initPickerNewEntity() {
		if (showRiskPicker === 'trigger') {
			pickerNewEntity = { id: '', text: '', type: 'yes-no', category: 'essentials', options: [] };
		} else if (showRiskPicker === 'mitigation') {
			pickerNewEntity = { id: '', code: '', name: '', description: '', category: '' };
		} else if (showRiskPicker === 'regulation') {
			pickerNewEntity = { id: '', citation: '', description: '', requirement: '', framework: '' };
		}
		pickerCreateMode = true;
	}

	// Create entity from picker and link it
	function createAndLinkEntity() {
		if (!pickerNewEntity || !showRiskPicker) return;

		// Validate required fields
		if (showRiskPicker === 'trigger' && (!pickerNewEntity.id || !pickerNewEntity.text)) {
			alert('Please provide ID and question text');
			return;
		}
		if (showRiskPicker === 'mitigation' && (!pickerNewEntity.id || !pickerNewEntity.code || !pickerNewEntity.name)) {
			alert('Please provide ID, code, and name');
			return;
		}
		if (showRiskPicker === 'regulation' && (!pickerNewEntity.id || !pickerNewEntity.citation || !pickerNewEntity.description)) {
			alert('Please provide ID, citation, and description');
			return;
		}

		// Create the entity
		if (showRiskPicker === 'trigger') {
			const questions = editableEntities.questions ? [...editableEntities.questions] : [...defaultQuestions];
			questions.push(pickerNewEntity);
			editableEntities = { ...editableEntities, questions };
		} else if (showRiskPicker === 'regulation') {
			const regulations = editableEntities.regulations ? [...editableEntities.regulations] : [...defaultRegulations];
			regulations.push(pickerNewEntity);
			editableEntities = { ...editableEntities, regulations };
		}

		// Link it
		addLinkFromPicker(pickerNewEntity.id);

		// Reset state
		pickerCreateMode = false;
		pickerNewEntity = null;
	}

	// Get items for risk picker based on type
	let riskPickerItems = $derived.by(() => {
		const q = riskPickerSearch.toLowerCase();
		if (showRiskPicker === 'trigger') {
			return allQuestions.filter(e => !q || e.text.toLowerCase().includes(q) || e.id.toLowerCase().includes(q));
		} else if (showRiskPicker === 'mitigation') {
			return allMitigations.filter(e => !q || e.name.toLowerCase().includes(q) || e.code.toLowerCase().includes(q));
		} else if (showRiskPicker === 'regulation') {
			return allRegulations.filter(e => !q || e.description.toLowerCase().includes(q) || e.citation.toLowerCase().includes(q));
		}
		return [];
	});

	// Add link from risk picker
	function addLinkFromPicker(itemId: string) {
		if (!selectedRiskId || !showRiskPicker) return;

		const newLink: any = {
			id: `link-${Date.now()}`,
			phases: ['phase-1', 'phase-2', 'phase-3']
		};

		if (showRiskPicker === 'trigger') {
			newLink.type = 'trigger';
			newLink.from = { entity: 'question', id: itemId };
			newLink.to = { entity: 'risk', id: selectedRiskId };
			newLink.answerValues = [];
			newLink.logic = 'OR';
		} else if (showRiskPicker === 'mitigation') {
			newLink.type = 'mitigation';
			newLink.from = { entity: 'risk', id: selectedRiskId };
			newLink.to = { entity: 'mitigation', id: itemId };
			newLink.guidance = {};
		} else if (showRiskPicker === 'regulation') {
			newLink.type = 'regulation';
			newLink.from = { entity: 'risk', id: selectedRiskId };
			newLink.to = { entity: 'regulation', id: itemId };
		}

		links = [...links, newLink];
		showRiskPicker = null;
		riskPickerSearch = '';
	}

	// Check if item is already linked to selected risk
	function isLinkedToRisk(type: 'trigger' | 'mitigation' | 'regulation', itemId: string): boolean {
		if (!selectedRiskId) return false;
		if (type === 'trigger') {
			return links.some((l: any) => l.type === 'trigger' && l.from.id === itemId && l.to.id === selectedRiskId);
		} else if (type === 'mitigation') {
			return links.some((l: any) => l.type === 'mitigation' && l.from.id === selectedRiskId && l.to.id === itemId);
		} else if (type === 'regulation') {
			return links.some((l: any) => l.type === 'regulation' && l.from.id === selectedRiskId && l.to.id === itemId);
		}
		return false;
	}

	function getEntityName(entity: string, id: string): string {
		if (entity === 'question') return getQuestion(id)?.text || id;
		if (entity === 'risk') return getRisk(id)?.shortName || id;
		if (entity === 'mitigation') return getMitigation(id)?.name || id;
		if (entity === 'regulation') return getRegulation(id)?.citation || id;
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

	// Filter entities by search
	function filterBySearch<T extends { id: string }>(items: T[], getText: (item: T) => string): T[] {
		if (!searchQuery) return items;
		const q = searchQuery.toLowerCase();
		return items.filter(item => getText(item).toLowerCase().includes(q) || item.id.toLowerCase().includes(q));
	}

	// Count links for a node
	function getLinkCount(type: string, id: string): number {
		return filteredLinks.filter((l: any) =>
			(l.from.entity === type && l.from.id === id) ||
			(l.to.entity === type && l.to.id === id)
		).length;
	}

	// Matrix helpers
	function getTriggerLink(questionId: string, riskId: string) {
		return filteredLinks.find((l: any) =>
			l.type === 'trigger' &&
			l.from.entity === 'question' && l.from.id === questionId &&
			l.to.entity === 'risk' && l.to.id === riskId
		);
	}

	function getMitigationLink(riskId: string, mitigationId: string) {
		return filteredLinks.find((l: any) =>
			l.type === 'mitigation' &&
			l.from.entity === 'risk' && l.from.id === riskId &&
			l.to.entity === 'mitigation' && l.to.id === mitigationId
		);
	}

	function getRegulationLink(riskId: string, regulationId: string) {
		return filteredLinks.find((l: any) =>
			l.type === 'regulation' &&
			l.from.entity === 'risk' && l.from.id === riskId &&
			l.to.entity === 'regulation' && l.to.id === regulationId
		);
	}

	function getControlLink(riskId: string, controlId: string) {
		return filteredLinks.find((l: any) =>
			l.type === 'control' &&
			l.from.entity === 'risk' && l.from.id === riskId &&
			l.to.entity === 'control' && l.to.id === controlId
		);
	}

	// Risk editor helpers
	function getTriggersForRisk(riskId: string) {
		return filteredLinks.filter((l: any) =>
			l.type === 'trigger' && l.to.entity === 'risk' && l.to.id === riskId
		);
	}

	function getMitigationsForRisk(riskId: string) {
		return filteredLinks.filter((l: any) =>
			l.type === 'mitigation' && l.from.entity === 'risk' && l.from.id === riskId
		);
	}

	function getRegulationsForRisk(riskId: string) {
		return filteredLinks.filter((l: any) =>
			l.type === 'regulation' && l.from.entity === 'risk' && l.from.id === riskId
		);
	}

	// Toggle link in matrix
	function toggleMatrixLink(type: 'trigger' | 'mitigation' | 'regulation' | 'control', fromId: string, toId: string) {
		let existing: any;
		let newLink: any;

		if (type === 'trigger') {
			existing = getTriggerLink(fromId, toId);
			newLink = {
				id: `link-${Date.now()}`,
				type: 'trigger',
				from: { entity: 'question', id: fromId },
				to: { entity: 'risk', id: toId },
				phases: ['phase-1', 'phase-2', 'phase-3'],
				answerValues: [],
				logic: 'OR'
			};
		} else if (type === 'mitigation') {
			existing = getMitigationLink(fromId, toId);
			newLink = {
				id: `link-${Date.now()}`,
				type: 'mitigation',
				from: { entity: 'risk', id: fromId },
				to: { entity: 'mitigation', id: toId },
				phases: ['phase-1', 'phase-2', 'phase-3'],
				guidance: {}
			};
		} else if (type === 'regulation') {
			existing = getRegulationLink(fromId, toId);
			newLink = {
				id: `link-${Date.now()}`,
				type: 'regulation',
				from: { entity: 'risk', id: fromId },
				to: { entity: 'regulation', id: toId },
				phases: ['phase-1', 'phase-2', 'phase-3']
			};
		} else {
			existing = getControlLink(fromId, toId);
			newLink = {
				id: `link-${Date.now()}`,
				type: 'control',
				from: { entity: 'risk', id: fromId },
				to: { entity: 'control', id: toId },
				phases: ['phase-1', 'phase-2', 'phase-3']
			};
		}

		if (existing) {
			// Edit existing link
			editingLink = JSON.parse(JSON.stringify(existing));
			showLinkEditor = true;
		} else {
			// Create new link
			editingLink = newLink;
			showLinkEditor = true;
		}
	}

	// Quick toggle (create/delete without editor)
	function quickToggleLink(type: 'trigger' | 'mitigation' | 'regulation' | 'control', fromId: string, toId: string) {
		let existing: any;

		if (type === 'trigger') existing = getTriggerLink(fromId, toId);
		else if (type === 'mitigation') existing = getMitigationLink(fromId, toId);
		else if (type === 'regulation') existing = getRegulationLink(fromId, toId);
		else existing = getControlLink(fromId, toId);

		if (existing) {
			links = links.filter((l: any) => l.id !== existing.id);
		} else {
			toggleMatrixLink(type, fromId, toId);
		}
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
		} else if (type === 'mitigation') {
			const m = getMitigation(id);
			return { type, item: m, connections };
		} else if (type === 'regulation') {
			const r = getRegulation(id);
			return { type, item: r, connections };
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
				<button class:active={currentView === 'risk-editor'} onclick={() => currentView = 'risk-editor'}>Risk Editor</button>
				<button class:active={currentView === 'graph'} onclick={() => currentView = 'graph'}>Graph</button>
				<button class:active={currentView === 'entities'} onclick={() => currentView = 'entities'}>Entities</button>
			</div>
		</div>
		<div class="header-right">
			{#if hasLocalChanges}
				<span class="status-badge local">Local changes</span>
			{:else}
				<span class="status-badge default">Default</span>
			{/if}
			<div class="phase-filter">
				<button class:active={selectedPhase === 'all'} onclick={() => selectedPhase = 'all'}>All</button>
				{#each phases as phase}
					<button class:active={selectedPhase === phase.id} onclick={() => selectedPhase = phase.id}>{phase.short}</button>
				{/each}
			</div>
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
			<div class="matrix-tabs">
				<button class:active={matrixType === 'triggers'} onclick={() => matrixType = 'triggers'}>
					Questions → Risks
				</button>
				<button class:active={matrixType === 'mitigations'} onclick={() => matrixType = 'mitigations'}>
					Risks → Control Categories
				</button>
				<button class:active={matrixType === 'controls'} onclick={() => matrixType = 'controls'}>
					Risks → Controls
				</button>
				<button class:active={matrixType === 'regulations'} onclick={() => matrixType = 'regulations'}>
					Risks → Regulations
				</button>
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
				<input type="text" placeholder="Search..." bind:value={searchQuery} class="search" />
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
			{#if matrixType === 'triggers'}
				{@const metadataQuestions = ['phase', 'model-types']}
				{@const filteredQuestions = filterBySearch(allQuestions, q => q.text).filter(q => !metadataQuestions.includes(q.id) && (!showUnlinkedOnly || (linkCounts.questionTriggers.get(q.id) || 0) === 0))}
				{@const filteredRisks = showUnlinkedOnly ? allRisks.filter(r => (linkCounts.riskTriggers.get(r.id) || 0) === 0) : allRisks}
				<table class="matrix">
					<thead>
						<tr>
							<th class="row-header">Question</th>
							{#each filteredRisks as risk}
								<th
									class="col-header"
									class:highlighted={matrixHoverCol === risk.id}
									title={risk.name}
									onmouseenter={() => matrixHoverCol = risk.id}
								>
									{#if matrixVerbose}
										<span class="verbose-label">{risk.shortName}</span>
									{:else}
										{risk.code}
									{/if}
								</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each filteredQuestions as question}
							<tr class:row-highlighted={matrixHoverRow === question.id}>
								<td
									class="row-label"
									class:highlighted={matrixHoverRow === question.id}
									title={question.text}
									onmouseenter={() => matrixHoverRow = question.id}
								>
									{#if matrixVerbose}
										<span class="verbose-label">{question.text}</span>
									{:else}
										{question.id}
									{/if}
								</td>
								{#each filteredRisks as risk}
									{@const link = getTriggerLink(question.id, risk.id)}
									<td
										class="matrix-cell"
										class:linked={link}
										class:col-highlighted={matrixHoverCol === risk.id}
										class:row-highlighted={matrixHoverRow === question.id}
										onclick={() => toggleMatrixLink('trigger', question.id, risk.id)}
										onmouseenter={() => { matrixHoverRow = question.id; matrixHoverCol = risk.id; }}
										title={link ? `Click to edit link` : `Click to link`}
									>
										{#if link}
											<span class="cell-marker">✓</span>
										{/if}
									</td>
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			{:else if matrixType === 'mitigations'}
				{@const filteredRisks = filterBySearch(allRisks, r => r.shortName).filter(r => !showUnlinkedOnly || (linkCounts.riskMitigations.get(r.id) || 0) === 0)}
				{@const filteredMitigations = showUnlinkedOnly ? allMitigations.filter(m => (linkCounts.mitigationRisks.get(m.id) || 0) === 0) : allMitigations}
				<table class="matrix">
					<thead>
						<tr>
							<th class="row-header">Risk</th>
							{#each filteredMitigations as mit}
								<th
									class="col-header"
									class:highlighted={matrixHoverCol === mit.id}
									title={mit.name}
									onmouseenter={() => matrixHoverCol = mit.id}
								>
									{#if matrixVerbose}
										<span class="verbose-label">{mit.name}</span>
									{:else}
										{mit.code}
									{/if}
								</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each filteredRisks as risk}
							<tr class:row-highlighted={matrixHoverRow === risk.id}>
								<td
									class="row-label"
									class:highlighted={matrixHoverRow === risk.id}
									title={risk.name}
									onmouseenter={() => matrixHoverRow = risk.id}
								>
									{#if matrixVerbose}
										<span class="verbose-label">{risk.shortName}</span>
									{:else}
										{risk.code}
									{/if}
								</td>
								{#each filteredMitigations as mit}
									{@const link = getMitigationLink(risk.id, mit.id)}
									<td
										class="matrix-cell"
										class:linked={link}
										class:col-highlighted={matrixHoverCol === mit.id}
										class:row-highlighted={matrixHoverRow === risk.id}
										onclick={() => toggleMatrixLink('mitigation', risk.id, mit.id)}
										onmouseenter={() => { matrixHoverRow = risk.id; matrixHoverCol = mit.id; }}
										title={link ? `Click to edit link` : `Click to link`}
									>
										{#if link}
											<span class="cell-marker">✓</span>
										{/if}
									</td>
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			{:else if matrixType === 'regulations'}
				{@const filteredRisks = filterBySearch(allRisks, r => r.shortName).filter(r => !showUnlinkedOnly || (linkCounts.riskRegulations.get(r.id) || 0) === 0)}
				{@const filteredRegulations = showUnlinkedOnly ? allRegulations.filter(r => (linkCounts.regulationRisks.get(r.id) || 0) === 0) : allRegulations}
				<table class="matrix">
					<thead>
						<tr>
							<th class="row-header">Risk</th>
							{#each filteredRegulations as reg}
								<th
									class="col-header"
									class:highlighted={matrixHoverCol === reg.id}
									title={reg.description}
									onmouseenter={() => matrixHoverCol = reg.id}
								>
									{#if matrixVerbose}
										<span class="verbose-label">{reg.citation}</span>
									{:else}
										{reg.citation.split('(')[0].trim()}
									{/if}
								</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each filteredRisks as risk}
							<tr class:row-highlighted={matrixHoverRow === risk.id}>
								<td
									class="row-label"
									class:highlighted={matrixHoverRow === risk.id}
									title={risk.name}
									onmouseenter={() => matrixHoverRow = risk.id}
								>
									{#if matrixVerbose}
										<span class="verbose-label">{risk.shortName}</span>
									{:else}
										{risk.code}
									{/if}
								</td>
								{#each filteredRegulations as reg}
									{@const link = getRegulationLink(risk.id, reg.id)}
									<td
										class="matrix-cell"
										class:linked={link}
										class:col-highlighted={matrixHoverCol === reg.id}
										class:row-highlighted={matrixHoverRow === risk.id}
										onclick={() => toggleMatrixLink('regulation', risk.id, reg.id)}
										onmouseenter={() => { matrixHoverRow = risk.id; matrixHoverCol = reg.id; }}
										title={link ? `Click to edit link` : `Click to link`}
									>
										{#if link}
											<span class="cell-marker">✓</span>
										{/if}
									</td>
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			{:else if matrixType === 'controls'}
				{@const filteredRisks = filterBySearch(allRisks, r => r.shortName)}
				{@const phaseFilteredControls = selectedPhase === 'all'
					? allControls
					: allControls.filter(c => c.phases?.includes(selectedPhase))}
				{@const techFilteredControls = selectedTechType === 'all'
					? phaseFilteredControls
					: phaseFilteredControls.filter(c => c.techTypes?.includes('all') || c.techTypes?.includes(selectedTechType))}
				{@const filteredControls = filterBySearch(techFilteredControls, c => c.name + ' ' + c.id).slice(0, 50)}
				<div class="controls-matrix-filters">
					<div class="filter-group">
						<label>Tech Type:</label>
						<select bind:value={selectedTechType}>
							<option value="all">All Types</option>
							{#each data.modelTypes as modelType}
								<option value={modelType.id}>{modelType.name}</option>
							{/each}
						</select>
					</div>
					<span class="note-text">Showing {filteredControls.length} of {techFilteredControls.length} controls (filtered from {allControls.length} total)</span>
				</div>
				<table class="matrix">
					<thead>
						<tr>
							<th class="row-header">Risk</th>
							{#each filteredControls as ctrl}
								{@const subcategory = getControlSubcategory(ctrl.subcategoryId)}
								<th
									class="col-header"
									class:highlighted={matrixHoverCol === ctrl.id}
									title={ctrl.name + ' (' + (subcategory?.name || ctrl.subcategoryId) + ')'}
									onmouseenter={() => matrixHoverCol = ctrl.id}
								>
									{#if matrixVerbose}
										<span class="verbose-label">{ctrl.name}</span>
									{:else}
										{ctrl.id.split('_')[0]}
									{/if}
								</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each filteredRisks as risk}
							<tr class:row-highlighted={matrixHoverRow === risk.id}>
								<td
									class="row-label"
									class:highlighted={matrixHoverRow === risk.id}
									title={risk.name}
									onmouseenter={() => matrixHoverRow = risk.id}
								>
									{#if matrixVerbose}
										<span class="verbose-label">{risk.shortName}</span>
									{:else}
										{risk.code}
									{/if}
								</td>
								{#each filteredControls as ctrl}
									{@const link = getControlLink(risk.id, ctrl.id)}
									<td
										class="matrix-cell"
										class:linked={link}
										class:col-highlighted={matrixHoverCol === ctrl.id}
										class:row-highlighted={matrixHoverRow === risk.id}
										onclick={() => toggleMatrixLink('control', risk.id, ctrl.id)}
										onmouseenter={() => { matrixHoverRow = risk.id; matrixHoverCol = ctrl.id; }}
										title={link ? `Click to edit link` : `Click to link`}
									>
										{#if link}
											<span class="cell-marker">✓</span>
										{/if}
									</td>
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}
		</div>

	<!-- RISK EDITOR VIEW -->
	{:else if currentView === 'risk-editor'}
		<div class="risk-editor">
			<div class="risk-list">
				<div class="risk-list-header">
					<input type="text" placeholder="Search risks..." bind:value={searchQuery} class="search" />
				</div>
				<div class="risk-list-items">
					{#each filterBySearch(allRisks, r => r.shortName + ' ' + r.name) as risk}
						{@const triggerCount = getTriggersForRisk(risk.id).length}
						{@const mitigationCount = getMitigationsForRisk(risk.id).length}
						{@const regulationCount = getRegulationsForRisk(risk.id).length}
						<button
							class="risk-list-item"
							class:selected={selectedRiskId === risk.id}
							onclick={() => selectedRiskId = risk.id}
						>
							<span class="risk-code">{risk.code}</span>
							<span class="risk-name">{risk.shortName}</span>
							<div class="risk-counts">
								<span class="count-badge trigger" title="Triggers">{triggerCount}</span>
								<span class="count-badge mitigation" title="Mitigations">{mitigationCount}</span>
								<span class="count-badge regulation" title="Regulations">{regulationCount}</span>
							</div>
						</button>
					{/each}
				</div>
			</div>

			<div class="risk-detail">
				{#if selectedRisk}
					<div class="risk-detail-header">
						<h2>{selectedRisk.code}: {selectedRisk.shortName}</h2>
						<p class="risk-full-name">{selectedRisk.name}</p>
					</div>

					<div class="risk-section">
						<h3>Triggers (Questions that activate this risk)</h3>
						<div class="link-list">
							{#each getTriggersForRisk(selectedRisk.id) as link}
								{@const question = getQuestion(link.from.id)}
								<button class="link-item" onclick={() => { editingLink = JSON.parse(JSON.stringify(link)); showLinkEditor = true; }}>
									<span class="link-icon">?</span>
									<span class="link-text">{question?.text || link.from.id}</span>
									<span class="link-meta">
										{#if link.answerValues?.length}
											when: {link.answerValues.join(', ')}
										{/if}
										{#if link.phases?.length < 3}
											| {link.phases.map((p: string) => p.replace('phase-', 'P')).join(', ')}
										{/if}
									</span>
								</button>
							{/each}
							<button class="add-link-btn" onclick={() => { showRiskPicker = 'trigger'; riskPickerSearch = ''; }}>+ Add Trigger</button>
						</div>
					</div>

					<div class="risk-section">
						<h3>Control Categories</h3>
						<div class="link-list">
							{#each getMitigationsForRisk(selectedRisk.id) as link}
								{@const mitigation = getMitigation(link.to.id)}
								<button class="link-item" onclick={() => { editingLink = JSON.parse(JSON.stringify(link)); showLinkEditor = true; }}>
									<span class="link-icon mitigation">M</span>
									<span class="link-text">{mitigation?.name || link.to.id}</span>
									<span class="link-meta">
										{#if link.phases?.length < 3}
											{link.phases.map((p: string) => p.replace('phase-', 'P')).join(', ')}
										{/if}
									</span>
								</button>
							{/each}
							<button class="add-link-btn" onclick={() => { showRiskPicker = 'mitigation'; riskPickerSearch = ''; }}>+ Add Control Category</button>
						</div>
					</div>

					<div class="risk-section">
						<h3>Regulations</h3>
						<div class="link-list">
							{#each getRegulationsForRisk(selectedRisk.id) as link}
								{@const regulation = getRegulation(link.to.id)}
								<button class="link-item" onclick={() => { editingLink = JSON.parse(JSON.stringify(link)); showLinkEditor = true; }}>
									<span class="link-icon regulation">R</span>
									<span class="link-text">{regulation?.citation || link.to.id}</span>
									<span class="link-meta">{regulation?.framework}</span>
								</button>
							{/each}
							<button class="add-link-btn" onclick={() => { showRiskPicker = 'regulation'; riskPickerSearch = ''; }}>+ Add Regulation</button>
						</div>
					</div>
				{:else}
					<div class="no-selection">
						<p>Select a risk from the list to view and edit its configuration.</p>
					</div>
				{/if}
			</div>

			<!-- Risk Picker Modal -->
			{#if showRiskPicker && selectedRisk}
				<div class="picker-overlay" onclick={() => { showRiskPicker = null; pickerCreateMode = false; }}>
					<div class="picker-modal" onclick={(e) => e.stopPropagation()}>
						<div class="picker-header">
							<h3>
								{#if showRiskPicker === 'trigger'}Add Trigger Question
								{:else if showRiskPicker === 'mitigation'}Add Control Category
								{:else}Add Regulation{/if}
							</h3>
							<button class="close-btn" onclick={() => { showRiskPicker = null; pickerCreateMode = false; }}>×</button>
						</div>

						{#if pickerCreateMode && pickerNewEntity && showRiskPicker !== 'mitigation'}
							<!-- Inline Create Form (not available for control categories - they come from controls taxonomy) -->
							<div class="picker-create-form">
								<h4>Create New {showRiskPicker === 'trigger' ? 'Question' : 'Regulation'}</h4>
								{#if showRiskPicker === 'trigger'}
									<div class="form-row">
										<label>ID <input type="text" bind:value={pickerNewEntity.id} placeholder="e.g., my-question" /></label>
									</div>
									<div class="form-row">
										<label>Question Text <textarea bind:value={pickerNewEntity.text} placeholder="Enter the question..." rows="2"></textarea></label>
									</div>
									<div class="form-row">
										<label>Type
											<select bind:value={pickerNewEntity.type}>
												<option value="yes-no">Yes/No</option>
												<option value="single-select">Single Select</option>
												<option value="multi-select">Multi Select</option>
											</select>
										</label>
									</div>
								{:else}
									<div class="form-row">
										<label>ID <input type="text" bind:value={pickerNewEntity.id} placeholder="e.g., my-reg-1" /></label>
									</div>
									<div class="form-row">
										<label>Citation <input type="text" bind:value={pickerNewEntity.citation} placeholder="e.g., 21 CFR 820.30" /></label>
									</div>
									<div class="form-row">
										<label>Description <input type="text" bind:value={pickerNewEntity.description} placeholder="Brief description" /></label>
									</div>
									<div class="form-row">
										<label>Requirement <textarea bind:value={pickerNewEntity.requirement} placeholder="Full requirement text..." rows="2"></textarea></label>
									</div>
								{/if}
								<div class="form-actions">
									<button class="btn" onclick={() => { pickerCreateMode = false; pickerNewEntity = null; }}>Cancel</button>
									<button class="btn primary" onclick={createAndLinkEntity}>Create & Link</button>
								</div>
							</div>
						{:else}
							<!-- Search & List -->
							<div class="picker-search">
								<input type="text" placeholder="Search..." bind:value={riskPickerSearch} />
								<button class="btn primary create-new-btn" onclick={initPickerNewEntity}>+ Create New</button>
							</div>
							<div class="picker-list">
								{#each riskPickerItems as item}
									{@const alreadyLinked = isLinkedToRisk(showRiskPicker, item.id)}
									<button
										class="picker-item"
										class:linked={alreadyLinked}
										disabled={alreadyLinked}
										onclick={() => addLinkFromPicker(item.id)}
									>
										{#if showRiskPicker === 'trigger'}
											<span class="picker-code question">{item.id}</span>
											<span class="picker-name">{item.text}</span>
										{:else if showRiskPicker === 'mitigation'}
											<span class="picker-code mitigation">{item.code}</span>
											<span class="picker-name">{item.name}</span>
											<span class="picker-category">{item.category}</span>
										{:else}
											<span class="picker-code regulation">{item.citation}</span>
											<span class="picker-name">{item.description}</span>
											<span class="picker-category">{item.framework}</span>
										{/if}
										{#if alreadyLinked}
											<span class="already-linked">Already linked</span>
										{/if}
									</button>
								{:else}
									<div class="picker-empty">No items found.{#if showRiskPicker !== 'mitigation'} <button class="link-btn" onclick={initPickerNewEntity}>Create new?</button>{/if}</div>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			{/if}
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
			<input type="text" placeholder="Search..." bind:value={searchQuery} class="search" />
		</div>

		<div class="layout">
		<!-- Four Columns -->
		<div class="columns">
			<!-- Questions Column -->
			<div class="column questions">
				<div class="column-header">
					<span class="column-icon">?</span>
					<h2>Questions</h2>
					<span class="count">{allQuestions.length}</span>
				</div>
				<div class="nodes">
					{#each filterBySearch(allQuestions, q => q.text) as q}
						{@const linkCount = getLinkCount('question', q.id)}
						{@const isSelected = selectedNode?.type === 'question' && selectedNode?.id === q.id}
						{@const connected = isConnected('question', q.id)}
						{@const connectionLink = getConnectionToSelected('question', q.id)}
						{@const shouldHide = focusMode && selectedNode && !isSelected && !connected}
						{#if !shouldHide}
						<div
							class="node question"
							class:selected={isSelected}
							class:connected
							class:connecting={connectingFrom?.type === 'question' && connectingFrom?.id === q.id}
							role="button"
							tabindex="0"
							onclick={() => handleNodeClick('question', q.id)}
							onkeydown={(e) => e.key === 'Enter' && handleNodeClick('question', q.id)}
						>
							<div class="node-header">
								<span class="node-id">{q.id}</span>
								{#if connected && connectionLink}
									<span class="conn-badge {connectionLink.type}">{connectionLink.type}</span>
								{:else if linkCount > 0}
									<span class="link-count">{linkCount}</span>
								{/if}
							</div>
							<div class="node-text">{q.text}</div>
							{#if connected}
								<div class="edit-hint">click to edit</div>
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
					<span class="count">{allRisks.length}</span>
				</div>
				<div class="nodes">
					{#each filterBySearch(allRisks, r => r.shortName + ' ' + r.name) as r}
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
								{#if connected && connectionLink}
									<span class="conn-badge {connectionLink.type}">{connectionLink.type}</span>
								{:else if linkCount > 0}
									<span class="link-count">{linkCount}</span>
								{/if}
							</div>
							<div class="node-text">{r.shortName}</div>
							{#if connected}
								<div class="edit-hint">click to edit</div>
							{/if}
							<button class="connect-btn" title="Connect to..." onclick={(e) => startConnect('risk', r.id, e)}>+</button>
						</div>
						{/if}
					{/each}
				</div>
			</div>

			<!-- Control Categories Column (AIHSR Mitigation Strategies) -->
			<div class="column mitigations">
				<div class="column-header">
					<span class="column-icon">C</span>
					<h2>Control Categories</h2>
					<span class="count">{allMitigations.length}</span>
				</div>
				<div class="nodes">
					{#each filterBySearch(allMitigations, m => m.name) as m}
						{@const linkCount = getLinkCount('mitigation', m.id)}
						{@const isSelected = selectedNode?.type === 'mitigation' && selectedNode?.id === m.id}
						{@const connected = isConnected('mitigation', m.id)}
						{@const connectionLink = getConnectionToSelected('mitigation', m.id)}
						{@const shouldHide = focusMode && selectedNode && !isSelected && !connected}
						{#if !shouldHide}
						<div
							class="node mitigation"
							class:selected={isSelected}
							class:connected
							class:connecting={connectingFrom?.type === 'mitigation' && connectingFrom?.id === m.id}
							role="button"
							tabindex="0"
							onclick={() => handleNodeClick('mitigation', m.id)}
							onkeydown={(e) => e.key === 'Enter' && handleNodeClick('mitigation', m.id)}
						>
							<div class="node-header">
								<span class="node-code">{m.code}</span>
								{#if connected && connectionLink}
									<span class="conn-badge {connectionLink.type}">{connectionLink.type}</span>
								{:else if linkCount > 0}
									<span class="link-count">{linkCount}</span>
								{/if}
							</div>
							<div class="node-text">{m.name}</div>
							{#if connected}
								<div class="edit-hint">click to edit</div>
							{/if}
							<button class="connect-btn" title="Connect to..." onclick={(e) => startConnect('mitigation', m.id, e)}>+</button>
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
					<span class="count">{allRegulations.length}</span>
				</div>
				<div class="nodes">
					{#each filterBySearch(allRegulations, r => r.citation + ' ' + r.description) as r}
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
								{#if connected && connectionLink}
									<span class="conn-badge {connectionLink.type}">{connectionLink.type}</span>
								{:else if linkCount > 0}
									<span class="link-count">{linkCount}</span>
								{/if}
							</div>
							<div class="node-text">{r.description}</div>
							{#if connected}
								<div class="edit-hint">click to edit</div>
							{/if}
							<button class="connect-btn" title="Connect to..." onclick={(e) => startConnect('regulation', r.id, e)}>+</button>
						</div>
						{/if}
					{/each}
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
				{:else if selectedDetails.type === 'risk' && selectedDetails.item}
					<h3>{selectedDetails.item.name}</h3>
					<div class="detail-meta">
						<span class="meta-item">Code: {selectedDetails.item.code}</span>
						<span class="meta-item">Domain: {selectedDetails.item.domain}</span>
					</div>
					<p class="detail-desc">{selectedDetails.item.shortName}</p>
				{:else if selectedDetails.type === 'mitigation' && selectedDetails.item}
					{@const subcategoryControls = allControls.filter(c => c.subcategoryId === selectedDetails.item?.id)}
					<h3>{selectedDetails.item.name}</h3>
					<div class="detail-meta">
						<span class="meta-item">Code: {selectedDetails.item.code}</span>
						<span class="meta-item">Category: {selectedDetails.item.category}</span>
					</div>
					{#if subcategoryControls.length > 0}
						<div class="detail-controls">
							<strong>Controls ({subcategoryControls.length}):</strong>
							<div class="controls-list">
								{#each subcategoryControls.slice(0, 10) as ctrl}
									<div class="control-item">
										<span class="control-name">{ctrl.name}</span>
										<span class="control-phases">{ctrl.phases?.map((p: string) => p.replace('phase-', 'P')).join(', ')}</span>
									</div>
								{/each}
								{#if subcategoryControls.length > 10}
									<div class="control-item more">...and {subcategoryControls.length - 10} more</div>
								{/if}
							</div>
						</div>
					{/if}
				{:else if selectedDetails.type === 'regulation' && selectedDetails.item}
					<h3>{selectedDetails.item.citation}</h3>
					<div class="detail-meta">
						<span class="meta-item">{selectedDetails.item.framework}</span>
					</div>
					<p class="detail-desc">{selectedDetails.item.description}</p>
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

	<!-- ENTITIES VIEW -->
	{#if currentView === 'entities'}
		<div class="entities-view">
			<div class="entities-toolbar">
				<div class="entity-type-tabs">
					<button class:active={entityType === 'risks'} onclick={() => entityType = 'risks'}>
						Risks ({allRisks.length})
					</button>
					<button class:active={entityType === 'controls'} onclick={() => entityType = 'controls'}>
						Controls ({allControls.length})
					</button>
					<button class:active={entityType === 'questions'} onclick={() => entityType = 'questions'}>
						Questions ({allQuestions.length})
					</button>
					<button class:active={entityType === 'regulations'} onclick={() => entityType = 'regulations'}>
						Regulations ({allRegulations.length})
					</button>
				</div>
				<div class="entities-actions">
					<input type="text" placeholder="Search..." bind:value={entitySearch} class="search" />
					<button class="btn primary" onclick={createNewEntity}>+ Add New</button>
					{#if hasEntityChanges}
						<button class="btn danger-outline" onclick={resetEntities}>Reset to Defaults</button>
					{/if}
				</div>
			</div>

			<div class="entities-list">
				{#if entityType === 'risks'}
					<div class="entity-table-header">
						<span class="col-code">Code</span>
						<span class="col-name">Name</span>
						<span class="col-short">Short Name</span>
						<span class="col-domain">Domain</span>
						<span class="col-actions">Actions</span>
					</div>
					{#each filteredEntities as entity}
						<div class="entity-row">
							<span class="col-code">
								<span class="code-badge risk">{entity.code}</span>
							</span>
							<span class="col-name">{entity.name}</span>
							<span class="col-short">{entity.shortName}</span>
							<span class="col-domain">{entity.domain}</span>
							<span class="col-actions">
								<button class="action-btn" onclick={() => editEntity(entity)}>Edit</button>
							</span>
						</div>
					{:else}
						<div class="no-entities">No risks found matching your search</div>
					{/each}
				{:else if entityType === 'questions'}
					<div class="entity-table-header">
						<span class="col-id">ID</span>
						<span class="col-text">Question</span>
						<span class="col-type">Type</span>
						<span class="col-category">Category</span>
						<span class="col-actions">Actions</span>
					</div>
					{#each filteredEntities as entity}
						<div class="entity-row">
							<span class="col-id">
								<span class="code-badge question">{entity.id}</span>
							</span>
							<span class="col-text">{entity.text}</span>
							<span class="col-type">{entity.type}</span>
							<span class="col-category">{entity.category}</span>
							<span class="col-actions">
								<button class="action-btn" onclick={() => editEntity(entity)}>Edit</button>
							</span>
						</div>
					{:else}
						<div class="no-entities">No questions found matching your search</div>
					{/each}
				{:else if entityType === 'regulations'}
					<div class="entity-table-header">
						<span class="col-citation">Citation</span>
						<span class="col-desc">Description</span>
						<span class="col-framework">Framework</span>
						<span class="col-actions">Actions</span>
					</div>
					{#each filteredEntities as entity}
						<div class="entity-row">
							<span class="col-citation">
								<span class="code-badge regulation">{entity.citation}</span>
							</span>
							<span class="col-desc">{entity.description}</span>
							<span class="col-framework">{entity.framework}</span>
							<span class="col-actions">
								<button class="action-btn" onclick={() => editEntity(entity)}>Edit</button>
							</span>
						</div>
					{:else}
						<div class="no-entities">No regulations found matching your search</div>
					{/each}
				{:else if entityType === 'controls'}
					<div class="entity-table-header">
						<span class="col-id">ID</span>
						<span class="col-name">Name</span>
						<span class="col-subcategory">Subcategory</span>
						<span class="col-source">Source</span>
						<span class="col-actions">Actions</span>
					</div>
					{#each filteredEntities as entity}
						{@const subcategory = getControlSubcategory(entity.subcategoryId)}
						<div class="entity-row">
							<span class="col-id">
								<span class="code-badge control">{entity.id.split('_')[0]}</span>
							</span>
							<span class="col-name">{entity.name}</span>
							<span class="col-subcategory">{subcategory?.name || entity.subcategoryId}</span>
							<span class="col-source">{entity.source}</span>
							<span class="col-actions">
								<button class="action-btn" onclick={() => editEntity(entity)}>Edit</button>
							</span>
						</div>
					{:else}
						<div class="no-entities">No controls found matching your search</div>
					{/each}
				{/if}
			</div>
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
						} else if (editingLink.type === 'mitigation') {
							editingLink.from = { entity: 'risk', id: allRisks[0]?.id || '' };
							editingLink.to = { entity: 'mitigation', id: allMitigations[0]?.id || '' };
						} else if (editingLink.type === 'regulation') {
							editingLink.from = { entity: 'risk', id: allRisks[0]?.id || '' };
							editingLink.to = { entity: 'regulation', id: allRegulations[0]?.id || '' };
						}
					}}>
						<option value="trigger">Trigger (Question triggers Risk)</option>
						<option value="mitigation">Control Category (Risk linked to Control Category)</option>
						<option value="regulation">Regulation (Risk linked to Regulation)</option>
						<option value="custom">Custom</option>
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

				{#if editingLink.type === 'mitigation'}
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

	.phase-filter {
		display: flex;
		gap: 0.25rem;
		background: #1e293b;
		padding: 0.25rem;
		border-radius: 0.375rem;
	}

	.phase-filter button {
		padding: 0.375rem 0.75rem;
		background: transparent;
		border: none;
		border-radius: 0.25rem;
		color: #94a3b8;
		font-size: 0.75rem;
		cursor: pointer;
	}

	.phase-filter button:hover { color: #e2e8f0; }
	.phase-filter button.active { background: #60a5fa; color: #0f172a; }

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

	.matrix-tabs {
		display: flex;
		gap: 0.5rem;
	}

	.matrix-tabs button {
		padding: 0.5rem 1rem;
		background: #1e293b;
		border: 1px solid #334155;
		border-radius: 0.375rem;
		color: #94a3b8;
		font-size: 0.75rem;
		cursor: pointer;
	}

	.matrix-tabs button:hover { border-color: #475569; color: #e2e8f0; }
	.matrix-tabs button.active { background: #334155; color: #e2e8f0; border-color: #60a5fa; }

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

	.controls-matrix-filters {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.5rem 1rem;
		background: rgba(6, 182, 212, 0.1);
		border-left: 3px solid #06b6d4;
		margin-bottom: 0.5rem;
		font-size: 0.75rem;
		color: #94a3b8;
	}

	.controls-matrix-filters .filter-group {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.controls-matrix-filters select {
		background: #1e293b;
		border: 1px solid #334155;
		border-radius: 4px;
		padding: 0.25rem 0.5rem;
		color: #e2e8f0;
		font-size: 0.75rem;
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

	.cell-marker {
		color: #22c55e;
		font-size: 0.75rem;
	}

	/* Risk Editor View */
	.risk-editor {
		display: flex;
		flex: 1;
		overflow: hidden;
	}

	.risk-list {
		width: 280px;
		background: #1e293b;
		border-right: 1px solid #334155;
		display: flex;
		flex-direction: column;
	}

	.risk-list-header {
		padding: 0.75rem;
		border-bottom: 1px solid #334155;
	}

	.risk-list-header .search {
		width: 100%;
	}

	.risk-list-items {
		flex: 1;
		overflow-y: auto;
		padding: 0.5rem;
	}

	.risk-list-item {
		width: 100%;
		text-align: left;
		padding: 0.75rem;
		background: #0f172a;
		border: 1px solid #334155;
		border-radius: 0.375rem;
		margin-bottom: 0.375rem;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.risk-list-item:hover {
		border-color: #475569;
	}

	.risk-list-item.selected {
		border-color: #ef4444;
		background: rgba(239, 68, 68, 0.1);
	}

	.risk-code {
		font-family: monospace;
		font-size: 0.625rem;
		color: #ef4444;
		background: rgba(239, 68, 68, 0.2);
		padding: 0.125rem 0.25rem;
		border-radius: 0.125rem;
		width: fit-content;
	}

	.risk-name {
		font-size: 0.75rem;
		color: #e2e8f0;
	}

	.risk-counts {
		display: flex;
		gap: 0.375rem;
		margin-top: 0.25rem;
	}

	.count-badge {
		font-size: 0.5625rem;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
	}

	.count-badge.trigger {
		background: rgba(96, 165, 250, 0.2);
		color: #60a5fa;
	}

	.count-badge.mitigation {
		background: rgba(34, 197, 94, 0.2);
		color: #22c55e;
	}

	.count-badge.regulation {
		background: rgba(168, 85, 247, 0.2);
		color: #a855f7;
	}

	.risk-detail {
		flex: 1;
		padding: 1.5rem;
		overflow-y: auto;
	}

	.risk-detail-header h2 {
		font-size: 1.25rem;
		color: #f1f5f9;
		margin-bottom: 0.25rem;
	}

	.risk-full-name {
		font-size: 0.875rem;
		color: #94a3b8;
		margin-bottom: 1.5rem;
	}

	.risk-section {
		margin-bottom: 1.5rem;
	}

	.risk-section h3 {
		font-size: 0.875rem;
		color: #94a3b8;
		margin-bottom: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.link-list {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.link-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		background: #1e293b;
		border: 1px solid #334155;
		border-radius: 0.375rem;
		cursor: pointer;
		text-align: left;
	}

	.link-item:hover {
		border-color: #475569;
	}

	.link-icon {
		width: 1.5rem;
		height: 1.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(96, 165, 250, 0.2);
		color: #60a5fa;
		border-radius: 0.25rem;
		font-size: 0.75rem;
		font-weight: bold;
		flex-shrink: 0;
	}

	.link-icon.mitigation {
		background: rgba(34, 197, 94, 0.2);
		color: #22c55e;
	}

	.link-icon.regulation {
		background: rgba(168, 85, 247, 0.2);
		color: #a855f7;
	}

	.link-text {
		flex: 1;
		font-size: 0.8125rem;
		color: #e2e8f0;
	}

	.link-meta {
		font-size: 0.6875rem;
		color: #64748b;
	}

	.add-link-btn {
		padding: 0.625rem;
		background: transparent;
		border: 1px dashed #475569;
		border-radius: 0.375rem;
		color: #64748b;
		font-size: 0.8125rem;
		cursor: pointer;
		text-align: center;
	}

	.add-link-btn:hover {
		border-color: #60a5fa;
		color: #60a5fa;
	}

	.no-selection {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: #64748b;
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
		grid-template-columns: repeat(4, 1fr);
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
		padding: 0.75rem;
		background: #1e293b;
		border-bottom: 1px solid #334155;
	}

	.column-icon {
		width: 1.5rem;
		height: 1.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 0.25rem;
		font-size: 0.75rem;
		font-weight: bold;
	}

	.questions .column-icon { background: rgba(96, 165, 250, 0.2); color: #60a5fa; }
	.risks .column-icon { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
	.mitigations .column-icon { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
	.regulations .column-icon { background: rgba(168, 85, 247, 0.2); color: #a855f7; }

	.column-header h2 {
		font-size: 0.875rem;
		color: #e2e8f0;
		flex: 1;
	}

	.count {
		font-size: 0.6875rem;
		color: #64748b;
		background: #334155;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
	}

	.nodes {
		flex: 1;
		overflow-y: auto;
		padding: 0.5rem;
	}

	.node {
		width: 100%;
		text-align: left;
		padding: 0.625rem;
		background: #0f172a;
		border: 1px solid #334155;
		border-radius: 0.375rem;
		margin-bottom: 0.375rem;
		cursor: pointer;
		position: relative;
		transition: all 0.15s;
	}

	.node:hover { border-color: #475569; }

	.node.question.selected { border-color: #60a5fa; background: rgba(96, 165, 250, 0.1); }
	.node.risk.selected { border-color: #ef4444; background: rgba(239, 68, 68, 0.1); }
	.node.mitigation.selected { border-color: #22c55e; background: rgba(34, 197, 94, 0.1); }
	.node.regulation.selected { border-color: #a855f7; background: rgba(168, 85, 247, 0.1); }

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
		font-size: 0.625rem;
		padding: 0.125rem 0.25rem;
		border-radius: 0.125rem;
	}

	.question .node-id { background: rgba(96, 165, 250, 0.2); color: #60a5fa; }
	.risk .node-code { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
	.mitigation .node-code { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
	.regulation .node-code { background: rgba(168, 85, 247, 0.2); color: #a855f7; font-size: 0.5625rem; }

	.link-count {
		font-size: 0.5625rem;
		background: #475569;
		color: #e2e8f0;
		padding: 0.0625rem 0.25rem;
		border-radius: 0.125rem;
	}

	.conn-badge {
		font-size: 0.5rem;
		font-weight: 600;
		text-transform: uppercase;
		padding: 0.125rem 0.25rem;
		border-radius: 0.125rem;
	}

	.conn-badge.trigger { background: rgba(251, 191, 36, 0.3); color: #fbbf24; }
	.conn-badge.mitigation { background: rgba(34, 197, 94, 0.3); color: #22c55e; }
	.conn-badge.regulation { background: rgba(168, 85, 247, 0.3); color: #a855f7; }
	.conn-badge.custom { background: rgba(148, 163, 184, 0.3); color: #94a3b8; }

	.edit-hint {
		font-size: 0.5625rem;
		color: #fbbf24;
		margin-top: 0.25rem;
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
		font-size: 0.75rem;
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
	.conn-type.mitigation { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
	.conn-type.regulation { background: rgba(168, 85, 247, 0.2); color: #a855f7; }
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
		max-width: 500px;
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
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		background: #0f172a;
		border-radius: 0.375rem;
		margin-bottom: 1rem;
		justify-content: center;
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
		padding: 0.375rem 0.75rem;
		border-radius: 0.25rem;
		max-width: 180px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		border: 1px solid transparent;
		cursor: pointer;
		display: flex;
		align-items: center;
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

	@media (max-width: 1200px) {
		.columns {
			grid-template-columns: repeat(2, 1fr);
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

	/* Entities View */
	.entities-view {
		display: flex;
		flex-direction: column;
		flex: 1;
		overflow: hidden;
	}

	.entities-toolbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 0;
		border-bottom: 1px solid #334155;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.entity-type-tabs {
		display: flex;
		gap: 0.5rem;
	}

	.entity-type-tabs button {
		padding: 0.5rem 1rem;
		background: #1e293b;
		border: 1px solid #334155;
		border-radius: 0.375rem;
		color: #94a3b8;
		font-size: 0.75rem;
		cursor: pointer;
	}

	.entity-type-tabs button:hover {
		border-color: #475569;
		color: #e2e8f0;
	}

	.entity-type-tabs button.active {
		background: #334155;
		color: #e2e8f0;
		border-color: #60a5fa;
	}

	.entities-actions {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.entities-list {
		flex: 1;
		overflow-y: auto;
		padding: 0.5rem 0;
	}

	.entity-table-header {
		display: flex;
		gap: 1rem;
		padding: 0.75rem;
		background: #1e293b;
		border-bottom: 1px solid #334155;
		position: sticky;
		top: 0;
		z-index: 1;
		font-size: 0.6875rem;
		color: #94a3b8;
		font-weight: 600;
		text-transform: uppercase;
	}

	.entity-row {
		display: flex;
		gap: 1rem;
		padding: 0.625rem 0.75rem;
		border-bottom: 1px solid #1e293b;
		align-items: center;
		transition: background 0.1s;
	}

	.entity-row:hover {
		background: #1e293b;
	}

	.entity-row.custom {
		background: rgba(251, 191, 36, 0.05);
	}

	.entity-row.custom:hover {
		background: rgba(251, 191, 36, 0.1);
	}

	.col-code, .col-id, .col-citation { flex: 0 0 100px; }
	.col-name { flex: 2; }
	.col-short { flex: 1; }
	.col-domain, .col-category, .col-framework { flex: 0 0 120px; }
	.col-type { flex: 0 0 80px; }
	.col-text { flex: 3; }
	.col-desc { flex: 2; }
	.col-actions { flex: 0 0 80px; text-align: right; }

	.code-badge {
		font-family: monospace;
		font-size: 0.625rem;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		display: inline-block;
	}

	.code-badge.risk { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
	.code-badge.mitigation { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
	.code-badge.question { background: rgba(96, 165, 250, 0.2); color: #60a5fa; }
	.code-badge.regulation { background: rgba(168, 85, 247, 0.2); color: #a855f7; }
	.code-badge.control { background: rgba(6, 182, 212, 0.2); color: #06b6d4; }

	.entity-row span:not(.code-badge):not(.readonly-badge) {
		font-size: 0.75rem;
		color: #e2e8f0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.action-btn {
		padding: 0.25rem 0.5rem;
		background: #334155;
		border: none;
		border-radius: 0.25rem;
		color: #e2e8f0;
		font-size: 0.6875rem;
		cursor: pointer;
	}

	.action-btn:hover {
		background: #475569;
	}

	.readonly-badge {
		font-size: 0.5625rem;
		color: #64748b;
		background: #1e293b;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
	}

	.entity-editor .modal-body {
		max-height: 60vh;
	}

	/* Risk Picker Modal */
	.picker-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 150;
	}

	.picker-modal {
		background: #1e293b;
		border: 1px solid #334155;
		border-radius: 0.5rem;
		width: 500px;
		max-width: 90vw;
		max-height: 70vh;
		display: flex;
		flex-direction: column;
	}

	.picker-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		border-bottom: 1px solid #334155;
	}

	.picker-header h3 {
		font-size: 1rem;
		color: #f1f5f9;
	}

	.picker-search {
		padding: 0.75rem;
		border-bottom: 1px solid #334155;
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.picker-search input {
		flex: 1;
		padding: 0.5rem 0.75rem;
		background: #0f172a;
		border: 1px solid #334155;
		border-radius: 0.375rem;
		color: #e2e8f0;
		font-size: 0.875rem;
	}

	.picker-search input:focus {
		outline: none;
		border-color: #60a5fa;
	}

	.create-new-btn {
		white-space: nowrap;
		padding: 0.5rem 0.75rem;
		font-size: 0.75rem;
	}

	/* Picker create form */
	.picker-create-form {
		padding: 1rem;
		background: #0f172a;
		border-bottom: 1px solid #334155;
	}

	.picker-create-form h4 {
		margin: 0 0 0.75rem;
		font-size: 0.875rem;
		color: #60a5fa;
	}

	.picker-create-form .form-row {
		margin-bottom: 0.75rem;
	}

	.picker-create-form label {
		display: block;
		font-size: 0.75rem;
		color: #94a3b8;
		margin-bottom: 0.25rem;
	}

	.picker-create-form input,
	.picker-create-form textarea,
	.picker-create-form select {
		width: 100%;
		padding: 0.5rem 0.75rem;
		background: #1e293b;
		border: 1px solid #334155;
		border-radius: 0.375rem;
		color: #e2e8f0;
		font-size: 0.875rem;
		margin-top: 0.25rem;
	}

	.picker-create-form textarea {
		resize: vertical;
		min-height: 60px;
	}

	.picker-create-form input:focus,
	.picker-create-form textarea:focus,
	.picker-create-form select:focus {
		outline: none;
		border-color: #60a5fa;
	}

	.picker-create-form .form-actions {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
		margin-top: 1rem;
	}

	.picker-list {
		flex: 1;
		overflow-y: auto;
		max-height: 400px;
	}

	.picker-item {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		background: transparent;
		border: none;
		border-bottom: 1px solid #1e293b;
		cursor: pointer;
		text-align: left;
		transition: background 0.1s;
	}

	.picker-item:hover:not(:disabled) {
		background: #0f172a;
	}

	.picker-item.linked {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.picker-code {
		font-family: monospace;
		font-size: 0.625rem;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		flex-shrink: 0;
		min-width: 70px;
		text-align: center;
	}

	.picker-code.question { background: rgba(96, 165, 250, 0.2); color: #60a5fa; }
	.picker-code.mitigation { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
	.picker-code.regulation { background: rgba(168, 85, 247, 0.2); color: #a855f7; }

	.picker-name {
		flex: 1;
		font-size: 0.8125rem;
		color: #e2e8f0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.picker-category {
		font-size: 0.6875rem;
		color: #64748b;
		flex-shrink: 0;
	}

	.already-linked {
		font-size: 0.625rem;
		color: #64748b;
		background: #334155;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
	}

	.picker-empty {
		padding: 2rem;
		text-align: center;
		color: #64748b;
		font-size: 0.875rem;
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
