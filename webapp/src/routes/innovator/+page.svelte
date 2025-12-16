<script lang="ts">
	import type { PageData } from './$types';
	import { browser } from '$app/environment';

	let { data }: { data: PageData } = $props();

	type ImplementationStatus = 'implemented' | 'in-protocol' | 'post-phase' | 'not-required';

	interface ControlSelection {
		controlId: string;
		controlName: string;
		riskId: string;
		riskName: string;
		strategyId: string;
		strategyName: string;
		status: ImplementationStatus;
		notes: string;
	}

	// State
	let answers = $state<Record<string, string | string[]>>({});
	let selectedStrategies = $state<Record<string, Set<string>>>({});
	let selectedControls = $state<Record<string, ControlSelection>>({});
	let expandedRisks = $state<Set<string>>(new Set());
	let controlSearch = $state('');
	let showControlsFor = $state<string | null>(null);
	let editingControlNotes = $state<string | null>(null);
	let appropriatenessFilter = $state<'all' | 'essential' | 'essential-recommended'>('all');
	let showOnlyUnaddressed = $state(false);
	let sourceFilter = $state<'all' | 'regulatory' | 'academic'>('all');

	// Source classification
	const regulatorySources = ['NIST2024', 'UK Government2023', 'EU AI Office2025'];
	const sourceLabels: Record<string, string> = {
		'NIST2024': 'NIST',
		'UK Government2023': 'UK Gov',
		'EU AI Office2025': 'EU',
		'Bengio2025': 'Bengio',
		'Barrett2024': 'Barrett',
		'Gipiškas2024': 'Gipiškas',
		'Eisenberg2025': 'Eisenberg',
		'Campos2025': 'Campos',
		'Uuk2024': 'Uuk',
		'Future of Life Institute2024': 'FLI',
		'Casper2025': 'Casper',
		'Wiener2024': 'Wiener',
		'Schuett2023': 'Schuett'
	};

	function getSourceLabel(source: string): string {
		return sourceLabels[source] || source.replace(/\d{4}$/, '');
	}

	function isRegulatory(source: string): boolean {
		return regulatorySources.includes(source);
	}

	type Appropriateness = 'essential' | 'recommended' | 'optional' | 'overkill';
	const appropriatenessOrder: Record<Appropriateness, number> = {
		'essential': 0,
		'recommended': 1,
		'optional': 2,
		'overkill': 3
	};

	const statusLabels: Record<ImplementationStatus, string> = {
		'implemented': 'Already Implemented',
		'in-protocol': 'In This Protocol',
		'post-phase': 'Post-Phase',
		'not-required': 'Not Required'
	};

	const statusColors: Record<ImplementationStatus, string> = {
		'implemented': '#22c55e',
		'in-protocol': '#3b82f6',
		'post-phase': '#f59e0b',
		'not-required': '#64748b'
	};

	// Check showIf conditions
	function checkShowIf(showIf: Record<string, string | string[]> | undefined): boolean {
		if (!showIf) return true;
		for (const [questionId, requiredValue] of Object.entries(showIf)) {
			const answer = answers[questionId];
			if (!answer) return false;
			if (Array.isArray(requiredValue)) {
				if (Array.isArray(answer)) {
					if (!requiredValue.some(v => answer.includes(v))) return false;
				} else {
					if (!requiredValue.includes(answer)) return false;
				}
			} else {
				if (Array.isArray(answer)) {
					if (!answer.includes(requiredValue)) return false;
				} else {
					if (answer !== requiredValue) return false;
				}
			}
		}
		return true;
	}

	let visibleCategories = $derived(
		data.questionCategories.filter((cat: any) => checkShowIf(cat.showIf))
	);

	let selectedPhase = $derived(answers['phase'] as string || '');
	let selectedModelTypes = $derived((answers['model-types'] as string[]) || []);
	let phaseName = $derived(
		selectedPhase === 'phase-1' ? 'Discovery' :
		selectedPhase === 'phase-2' ? 'Validation' :
		selectedPhase === 'phase-3' ? 'Deployment' : ''
	);

	// Pre-index data structures (computed once on load)
	const controlsBySubcategory = new Map<string, any[]>();
	for (const control of data.controls) {
		const key = control.subcategoryId;
		if (!controlsBySubcategory.has(key)) controlsBySubcategory.set(key, []);
		controlsBySubcategory.get(key)!.push(control);
	}

	// Index subdomains and strategies by ID for O(1) lookup
	const subdomainsById = new Map(data.subdomains.map((s: any) => [s.id, s]));
	const strategiesById = new Map(data.strategies.map((s: any) => [s.id, s]));

	// Pre-filter links by type (avoid repeated filtering)
	const triggerLinks = data.links.filter((l: any) =>
		l.type === 'trigger' && l.from.entity === 'question' && l.to.entity === 'risk'
	);
	const mitigationLinksByRisk = new Map<string, any[]>();
	for (const link of data.links) {
		if (link.type === 'mitigation' && link.from.entity === 'risk' && link.to.entity === 'subcategory') {
			const riskId = link.from.id;
			if (!mitigationLinksByRisk.has(riskId)) mitigationLinksByRisk.set(riskId, []);
			mitigationLinksByRisk.get(riskId)!.push(link);
		}
	}

	// Pre-filter controls by phase and techType (recomputes when those change)
	let filteredControlsByStrategy = $derived.by(() => {
		const result = new Map<string, any[]>();
		for (const [strategyId, controls] of controlsBySubcategory) {
			let filtered = controls;
			// Filter by phase
			if (selectedPhase) {
				filtered = filtered.filter((c: any) =>
					!c.phases || c.phases.length === 0 || c.phases.includes(selectedPhase)
				);
			}
			// Filter by techType
			if (selectedModelTypes.length > 0) {
				filtered = filtered.filter((c: any) =>
					!c.techTypes || c.techTypes.includes('all') ||
					c.techTypes.some((t: string) => selectedModelTypes.includes(t))
				);
			}
			result.set(strategyId, filtered);
		}
		return result;
	});

	// Calculate triggered subdomains
	let triggeredSubdomains = $derived.by(() => {
		const triggered = new Set<string>();

		for (const link of triggerLinks) {
			const questionId = link.from.id;
			const answer = answers[questionId];
			if (!answer) continue;
			const answerValues = link.answerValues || [];
			let matches = Array.isArray(answer)
				? answer.some(val => answerValues.includes(val))
				: answerValues.includes(answer);
			if (matches) {
				if (selectedPhase && link.phases && !link.phases.includes(selectedPhase)) continue;
				triggered.add(link.to.id);
			}
		}

		for (const modelType of (answers['model-types'] as string[] || [])) {
			const relevantSubdomains = data.modelTypeRelevance[modelType];
			if (relevantSubdomains) relevantSubdomains.forEach((s: string) => triggered.add(s));
		}

		for (const vuln of (answers['vulnerable-populations'] as string[] || [])) {
			if (vuln === 'none') continue;
			const multiplier = data.vulnerabilityMultipliers[vuln];
			if (multiplier?.triggersSubdomains) {
				multiplier.triggersSubdomains.forEach((s: string) => triggered.add(s));
			}
		}

		return triggered;
	});

	let triggeredRisks = $derived.by(() => {
		if (!selectedPhase) return [];

		const risks: Array<{
			subdomain: any;
			domain: any;
			riskContext: string;
			linkedStrategies: any[];
		}> = [];

		for (const domain of data.domains) {
			for (const subId of domain.subdomains) {
				if (!triggeredSubdomains.has(subId)) continue;
				const subdomain = subdomainsById.get(subId);
				if (!subdomain) continue;

				const riskContext = subdomain.phaseGuidance?.[selectedPhase] || '';
				const riskStrategyLinks = mitigationLinksByRisk.get(subId) || [];
				const linkedStrategies = riskStrategyLinks
					.map((link: any) => strategiesById.get(link.to.id))
					.filter(Boolean);

				if (riskContext || linkedStrategies.length > 0) {
					risks.push({ subdomain, domain, riskContext, linkedStrategies });
				}
			}
		}
		return risks;
	});

	function getControlsForStrategy(strategyId: string): any[] {
		// Use pre-filtered cache (already filtered by phase and techType)
		let controls = filteredControlsByStrategy.get(strategyId) || [];

		// Only apply runtime filters (source and search)
		if (sourceFilter === 'regulatory') {
			controls = controls.filter((c: any) => isRegulatory(c.source));
		} else if (sourceFilter === 'academic') {
			controls = controls.filter((c: any) => !isRegulatory(c.source));
		}
		if (controlSearch.trim()) {
			const search = controlSearch.toLowerCase();
			controls = controls.filter((c: any) =>
				c.name.toLowerCase().includes(search) ||
				c.description?.toLowerCase().includes(search)
			);
		}
		// Sort: regulatory first, then by name
		return [...controls].sort((a: any, b: any) => {
			const aReg = isRegulatory(a.source) ? 0 : 1;
			const bReg = isRegulatory(b.source) ? 0 : 1;
			if (aReg !== bReg) return aReg - bReg;
			return a.name.localeCompare(b.name);
		});
	}

	function toggleMulti(questionId: string, value: string) {
		const current = (answers[questionId] as string[]) || [];
		const newSet = new Set(current);
		if (value === 'none') {
			answers[questionId] = ['none'];
			return;
		}
		newSet.delete('none');
		if (newSet.has(value)) newSet.delete(value);
		else newSet.add(value);
		answers[questionId] = Array.from(newSet);
	}

	function toggleStrategy(riskId: string, strategyId: string) {
		if (!selectedStrategies[riskId]) selectedStrategies[riskId] = new Set();
		const newSet = new Set(selectedStrategies[riskId]);
		if (newSet.has(strategyId)) newSet.delete(strategyId);
		else newSet.add(strategyId);
		selectedStrategies[riskId] = newSet;
	}

	function toggleRiskExpanded(riskId: string) {
		const newSet = new Set(expandedRisks);
		if (newSet.has(riskId)) newSet.delete(riskId);
		else newSet.add(riskId);
		expandedRisks = newSet;
	}

	function toggleControlsPanel(strategyId: string) {
		showControlsFor = showControlsFor === strategyId ? null : strategyId;
		controlSearch = '';
	}

	function makeControlKey(controlId: string, riskId: string, strategyId: string): string {
		return `${controlId}|${riskId}|${strategyId}`;
	}

	function toggleControl(control: any, risk: any, strategy: any) {
		const key = makeControlKey(control.id, risk.subdomain.id, strategy.id);
		if (selectedControls[key]) {
			const { [key]: _, ...rest } = selectedControls;
			selectedControls = rest;
		} else {
			selectedControls = {
				...selectedControls,
				[key]: {
					controlId: control.id,
					controlName: control.name,
					riskId: risk.subdomain.id,
					riskName: risk.subdomain.shortName,
					strategyId: strategy.id,
					strategyName: strategy.name,
					status: 'in-protocol',
					notes: ''
				}
			};
			// Auto-select the strategy if not already
			if (!selectedStrategies[risk.subdomain.id]?.has(strategy.id)) {
				toggleStrategy(risk.subdomain.id, strategy.id);
			}
		}
	}

	function updateControlStatus(key: string, status: ImplementationStatus) {
		if (selectedControls[key]) {
			selectedControls = {
				...selectedControls,
				[key]: { ...selectedControls[key], status }
			};
		}
	}

	function updateControlNotes(key: string, notes: string) {
		if (selectedControls[key]) {
			selectedControls = {
				...selectedControls,
				[key]: { ...selectedControls[key], notes }
			};
		}
	}

	function isControlSelected(controlId: string, riskId: string, strategyId: string): boolean {
		return !!selectedControls[makeControlKey(controlId, riskId, strategyId)];
	}

	function getControlSelection(controlId: string, riskId: string, strategyId: string): ControlSelection | null {
		return selectedControls[makeControlKey(controlId, riskId, strategyId)] || null;
	}

	function getSelectedCount(riskId: string): number {
		return selectedStrategies[riskId]?.size || 0;
	}

	function getControlCount(riskId: string): number {
		return selectedControlsByRisk.get(riskId)?.length || 0;
	}

	function getDefenseCoverage(riskId: string, linkedStrategies: any[]) {
		const selected = selectedStrategies[riskId] || new Set();
		const coverage = { preventive: false, detective: false, corrective: false };
		for (const strategy of linkedStrategies) {
			if (selected.has(strategy.id)) {
				const layer = strategy.defenseLayer as keyof typeof coverage;
				if (layer in coverage) coverage[layer] = true;
			}
		}
		return coverage;
	}

	// Get appropriateness level for a strategy in current phase
	function getAppropriateness(strategy: any): Appropriateness {
		return strategy.phaseAppropriateness?.[selectedPhase] || 'optional';
	}

	// Pre-compute selected controls by risk (avoids repeated Object.values())
	let selectedControlsByRisk = $derived.by(() => {
		const byRisk = new Map<string, ControlSelection[]>();
		for (const control of Object.values(selectedControls)) {
			if (!byRisk.has(control.riskId)) byRisk.set(control.riskId, []);
			byRisk.get(control.riskId)!.push(control);
		}
		return byRisk;
	});

	// Pre-compute essential coverage for all triggered risks
	let essentialCoverageByRisk = $derived.by(() => {
		const coverage = new Map<string, { total: number; selected: number; complete: boolean; hasEssential: boolean }>();
		for (const risk of triggeredRisks) {
			const riskId = risk.subdomain.id;
			const essentialStrategies = risk.linkedStrategies.filter((s: any) =>
				s.phaseAppropriateness?.[selectedPhase] === 'essential'
			);
			const riskControls = selectedControlsByRisk.get(riskId) || [];
			const selectedEssential = essentialStrategies.filter((s: any) =>
				riskControls.some(c => c.strategyId === s.id)
			);
			coverage.set(riskId, {
				total: essentialStrategies.length,
				selected: selectedEssential.length,
				complete: essentialStrategies.length > 0 && selectedEssential.length === essentialStrategies.length,
				hasEssential: essentialStrategies.length > 0
			});
		}
		return coverage;
	});

	// Get essential coverage stats for a risk (uses memoized map)
	function getEssentialCoverage(riskId: string, _linkedStrategies?: any[]) {
		return essentialCoverageByRisk.get(riskId) || { total: 0, selected: 0, complete: false, hasEssential: false };
	}

	// Filter strategies by appropriateness
	function filterStrategiesByAppropriateness(strategies: any[]): any[] {
		let filtered = strategies;

		if (appropriatenessFilter === 'essential') {
			filtered = strategies.filter(s => getAppropriateness(s) === 'essential');
		} else if (appropriatenessFilter === 'recommended') {
			filtered = strategies.filter(s => getAppropriateness(s) === 'recommended');
		} else if (appropriatenessFilter === 'essential-recommended') {
			filtered = strategies.filter(s => ['essential', 'recommended'].includes(getAppropriateness(s)));
		}

		// Sort by appropriateness (essential first)
		return filtered.sort((a, b) => {
			const aLevel = appropriatenessOrder[getAppropriateness(a)] ?? 2;
			const bLevel = appropriatenessOrder[getAppropriateness(b)] ?? 2;
			return aLevel - bLevel;
		});
	}

	// Check if risk has unaddressed essential strategies
	function hasUnaddressedEssential(riskId: string, linkedStrategies: any[]): boolean {
		const coverage = getEssentialCoverage(riskId, linkedStrategies);
		return coverage.hasEssential && !coverage.complete;
	}

	// Quick select: add all essential controls for a risk
	function selectAllEssential(risk: any) {
		const essentialStrategies = risk.linkedStrategies.filter((s: any) => getAppropriateness(s) === 'essential');

		for (const strategy of essentialStrategies) {
			const controls = getControlsForStrategy(strategy.id);
			// Select the first control from each essential strategy if none selected
			const hasSelection = controls.some(c => isControlSelected(c.id, risk.subdomain.id, strategy.id));
			if (!hasSelection && controls.length > 0) {
				const control = controls[0];
				const key = makeControlKey(control.id, risk.subdomain.id, strategy.id);
				selectedControls = {
					...selectedControls,
					[key]: {
						controlId: control.id,
						controlName: control.name,
						riskId: risk.subdomain.id,
						riskName: risk.subdomain.shortName,
						strategyId: strategy.id,
						strategyName: strategy.name,
						status: 'in-protocol',
						notes: ''
					}
				};
			}
		}
	}

	// Filter risks to show only unaddressed if toggle is on
	let displayedRisks = $derived.by(() => {
		if (!showOnlyUnaddressed) return triggeredRisks;
		return triggeredRisks.filter(r => hasUnaddressedEssential(r.subdomain.id, r.linkedStrategies));
	});

	// Global stats
	let totalEssentialStrategies = $derived.by(() => {
		let count = 0;
		for (const risk of triggeredRisks) {
			count += risk.linkedStrategies.filter((s: any) => getAppropriateness(s) === 'essential').length;
		}
		return count;
	});

	let addressedEssentialStrategies = $derived.by(() => {
		let count = 0;
		for (const risk of triggeredRisks) {
			const coverage = getEssentialCoverage(risk.subdomain.id, risk.linkedStrategies);
			count += coverage.selected;
		}
		return count;
	});

	let risksWithUnaddressedEssential = $derived(
		triggeredRisks.filter(r => hasUnaddressedEssential(r.subdomain.id, r.linkedStrategies)).length
	);

	let totalSelectedControls = $derived(Object.keys(selectedControls).length);

	let risksAddressed = $derived(
		triggeredRisks.filter(r => getSelectedCount(r.subdomain.id) > 0 || getControlCount(r.subdomain.id) > 0).length
	);

	// Protocol content organized by risk (sequential numbering)
	let protocolItems = $derived.by(() => {
		const items: Array<{
			riskIndex: number;
			risk: any;
			controls: ControlSelection[];
		}> = [];

		let riskIndex = 0;
		for (const risk of triggeredRisks) {
			const riskControls = selectedControlsByRisk.get(risk.subdomain.id) || [];
			if (riskControls.length > 0) {
				riskIndex++;
				items.push({
					riskIndex,
					risk,
					controls: riskControls
				});
			}
		}
		return items;
	});

	let hasProtocolContent = $derived(protocolItems.length > 0);

	// Protocol items grouped by status for display
	let implementedControls = $derived(
		protocolItems.flatMap(i => i.controls.filter(c => c.status === 'implemented').map(c => ({ ...i, control: c })))
	);
	let inProtocolControls = $derived(
		protocolItems.flatMap(i => i.controls.filter(c => c.status === 'in-protocol').map(c => ({ ...i, control: c })))
	);
	let postPhaseControls = $derived(
		protocolItems.flatMap(i => i.controls.filter(c => c.status === 'post-phase').map(c => ({ ...i, control: c })))
	);
	let notRequiredControls = $derived(
		protocolItems.flatMap(i => i.controls.filter(c => c.status === 'not-required').map(c => ({ ...i, control: c })))
	);

	// Transform imperative description to protocol-appropriate prose
	function transformToProtocolProse(text: string, tense: 'past' | 'future'): string {
		if (!text) return '';

		let result = text.trim();

		// Convert imperative verbs at start of sentences to appropriate tense
		const imperativePatterns: Array<[RegExp, string, string]> = [
			// [pattern, past replacement, future replacement]
			[/^Engage\b/i, 'The research team engaged', 'The research team will engage'],
			[/^Use\b/i, 'The research team used', 'The research team will use'],
			[/^Implement\b/i, 'The research team implemented', 'The research team will implement'],
			[/^Develop\b/i, 'The research team developed', 'The research team will develop'],
			[/^Create\b/i, 'The research team created', 'The research team will create'],
			[/^Establish\b/i, 'The research team established', 'The research team will establish'],
			[/^Define\b/i, 'The research team defined', 'The research team will define'],
			[/^Document\b/i, 'The research team documented', 'The research team will document'],
			[/^Monitor\b/i, 'The research team monitored', 'The research team will monitor'],
			[/^Conduct\b/i, 'The research team conducted', 'The research team will conduct'],
			[/^Perform\b/i, 'The research team performed', 'The research team will perform'],
			[/^Apply\b/i, 'The research team applied', 'The research team will apply'],
			[/^Ensure\b/i, 'The research team ensured', 'The research team will ensure'],
			[/^Maintain\b/i, 'The research team maintained', 'The research team will maintain'],
			[/^Evaluate\b/i, 'The research team evaluated', 'The research team will evaluate'],
			[/^Assess\b/i, 'The research team assessed', 'The research team will assess'],
			[/^Review\b/i, 'The research team reviewed', 'The research team will review'],
			[/^Test\b/i, 'The research team tested', 'The research team will test'],
			[/^Validate\b/i, 'The research team validated', 'The research team will validate'],
			[/^Verify\b/i, 'The research team verified', 'The research team will verify'],
			[/^Train\b/i, 'The research team trained', 'The research team will train'],
			[/^Provide\b/i, 'The research team provided', 'The research team will provide'],
			[/^Include\b/i, 'The research team included', 'The research team will include'],
			[/^Consider\b/i, 'The research team considered', 'The research team will consider'],
			[/^Design\b/i, 'The research team designed', 'The research team will design'],
			[/^Build\b/i, 'The research team built', 'The research team will build'],
			[/^Configure\b/i, 'The research team configured', 'The research team will configure'],
			[/^Set up\b/i, 'The research team set up', 'The research team will set up'],
			[/^Collect\b/i, 'The research team collected', 'The research team will collect'],
			[/^Analyze\b/i, 'The research team analyzed', 'The research team will analyze'],
			[/^Track\b/i, 'The research team tracked', 'The research team will track'],
			[/^Log\b/i, 'The research team logged', 'The research team will log'],
			[/^Record\b/i, 'The research team recorded', 'The research team will record'],
			[/^Limit\b/i, 'The research team limited', 'The research team will limit'],
			[/^Restrict\b/i, 'The research team restricted', 'The research team will restrict'],
			[/^Allow\b/i, 'The research team allowed', 'The research team will allow'],
			[/^Enable\b/i, 'The research team enabled', 'The research team will enable'],
			[/^Require\b/i, 'The research team required', 'The research team will require'],
		];

		for (const [pattern, pastReplacement, futureReplacement] of imperativePatterns) {
			if (pattern.test(result)) {
				result = result.replace(pattern, tense === 'past' ? pastReplacement : futureReplacement);
				break;
			}
		}

		// If no pattern matched and starts with capital letter verb, add generic prefix
		if (result === text.trim() && /^[A-Z][a-z]+\b/.test(result)) {
			const firstWord = result.match(/^([A-Z][a-z]+)\b/)?.[1]?.toLowerCase();
			if (firstWord && ['identify', 'specify', 'determine', 'select', 'choose', 'assign', 'allocate'].includes(firstWord)) {
				result = tense === 'past'
					? `The research team ${result.charAt(0).toLowerCase()}${result.slice(1)}`
					: `The research team will ${result.charAt(0).toLowerCase()}${result.slice(1)}`;
			}
		}

		return result;
	}

	function generateProtocolText(control: ControlSelection): string {
		const controlData = data.controls.find((c: any) => c.id === control.controlId);
		const rawDescription = controlData?.description || '';

		// If user provided notes, those are the primary content
		if (control.notes) {
			switch (control.status) {
				case 'implemented':
					return control.notes;
				case 'in-protocol':
					return control.notes;
				case 'post-phase':
					return `Following the ${phaseName} phase: ${control.notes}`;
				case 'not-required':
					return `Not applicable: ${control.notes}`;
				default:
					return control.notes;
			}
		}

		// Transform the description based on status
		switch (control.status) {
			case 'implemented':
				return transformToProtocolProse(rawDescription, 'past') ||
					`${control.controlName} has been implemented to address ${control.riskName}.`;
			case 'in-protocol':
				return transformToProtocolProse(rawDescription, 'future') ||
					`${control.controlName} will be implemented to mitigate ${control.riskName}.`;
			case 'post-phase':
				return `Following the ${phaseName} phase: ${transformToProtocolProse(rawDescription, 'future') || control.controlName + ' will be implemented.'}`;
			case 'not-required':
				return `${control.controlName} was evaluated and determined not applicable to this study's scope.`;
			default:
				return rawDescription || control.controlName;
		}
	}

	async function exportDocx() {
		if (!browser) return;

		const { Document, Paragraph, TextRun, HeadingLevel, Packer, Table, TableRow, TableCell, BorderStyle, WidthType } = await import('docx');
		const { saveAs } = await import('file-saver');

		const children: any[] = [];

		children.push(
			new Paragraph({
				text: 'AI Research Protocol',
				heading: HeadingLevel.TITLE,
				spacing: { after: 100 }
			}),
			new Paragraph({
				children: [
					new TextRun({ text: 'Risk Mitigation Plan', italics: true, size: 24, color: '666666' })
				],
				spacing: { after: 400 }
			})
		);

		children.push(
			new Table({
				width: { size: 100, type: WidthType.PERCENTAGE },
				borders: {
					top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
					bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
					left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
					right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
					insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
					insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' }
				},
				rows: [
					new TableRow({
						children: [
							new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Development Phase', bold: true })] })] }),
							new TableCell({ children: [new Paragraph(phaseName || 'Not specified')] })
						]
					}),
					new TableRow({
						children: [
							new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Model Types', bold: true })] })] }),
							new TableCell({ children: [new Paragraph(selectedModelTypes.join(', ') || 'Not specified')] })
						]
					}),
					new TableRow({
						children: [
							new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Date', bold: true })] })] }),
							new TableCell({ children: [new Paragraph(new Date().toLocaleDateString())] })
						]
					}),
					new TableRow({
						children: [
							new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Risks Addressed', bold: true })] })] }),
							new TableCell({ children: [new Paragraph(`${risksAddressed} of ${triggeredRisks.length}`)] })
						]
					}),
					new TableRow({
						children: [
							new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Controls Selected', bold: true })] })] }),
							new TableCell({ children: [new Paragraph(`${totalSelectedControls}`)] })
						]
					})
				]
			}),
			new Paragraph({ spacing: { after: 400 } })
		);

		// Group by implementation status
		const byStatus: Record<ImplementationStatus, typeof protocolItems> = {
			'implemented': [],
			'in-protocol': [],
			'post-phase': [],
			'not-required': []
		};

		for (const item of protocolItems) {
			for (const control of item.controls) {
				const existing = byStatus[control.status].find(i => i.riskIndex === item.riskIndex);
				if (existing) {
					existing.controls.push(control);
				} else {
					byStatus[control.status].push({ ...item, controls: [control] });
				}
			}
		}

		// Already Implemented section
		if (byStatus['implemented'].length > 0) {
			children.push(
				new Paragraph({
					text: 'Already Implemented Controls',
					heading: HeadingLevel.HEADING_1,
					spacing: { before: 400, after: 200 }
				})
			);
			for (const item of byStatus['implemented']) {
				children.push(
					new Paragraph({
						text: `${item.riskIndex}. ${item.risk.subdomain.shortName}`,
						heading: HeadingLevel.HEADING_2,
						spacing: { before: 200, after: 100 }
					})
				);
				item.controls.forEach((control, i) => {
					children.push(
						new Paragraph({
							text: `${item.riskIndex}.${i + 1} ${generateProtocolText(control)}`,
							spacing: { after: 150 }
						})
					);
				});
			}
		}

		// In This Protocol section
		if (byStatus['in-protocol'].length > 0) {
			children.push(
				new Paragraph({
					text: 'Controls to be Implemented in This Protocol',
					heading: HeadingLevel.HEADING_1,
					spacing: { before: 400, after: 200 }
				})
			);
			for (const item of byStatus['in-protocol']) {
				children.push(
					new Paragraph({
						text: `${item.riskIndex}. ${item.risk.subdomain.shortName}`,
						heading: HeadingLevel.HEADING_2,
						spacing: { before: 200, after: 100 }
					})
				);
				item.controls.forEach((control, i) => {
					children.push(
						new Paragraph({
							text: `${item.riskIndex}.${i + 1} ${generateProtocolText(control)}`,
							spacing: { after: 150 }
						})
					);
				});
			}
		}

		// Post-Phase section
		if (byStatus['post-phase'].length > 0) {
			children.push(
				new Paragraph({
					text: 'Controls Planned for Post-Phase Implementation',
					heading: HeadingLevel.HEADING_1,
					spacing: { before: 400, after: 200 }
				})
			);
			for (const item of byStatus['post-phase']) {
				children.push(
					new Paragraph({
						text: `${item.riskIndex}. ${item.risk.subdomain.shortName}`,
						heading: HeadingLevel.HEADING_2,
						spacing: { before: 200, after: 100 }
					})
				);
				item.controls.forEach((control, i) => {
					children.push(
						new Paragraph({
							text: `${item.riskIndex}.${i + 1} ${generateProtocolText(control)}`,
							spacing: { after: 150 }
						})
					);
				});
			}
		}

		// Not Required section
		if (byStatus['not-required'].length > 0) {
			children.push(
				new Paragraph({
					text: 'Controls Evaluated as Not Required',
					heading: HeadingLevel.HEADING_1,
					spacing: { before: 400, after: 200 }
				})
			);
			for (const item of byStatus['not-required']) {
				children.push(
					new Paragraph({
						text: `${item.riskIndex}. ${item.risk.subdomain.shortName}`,
						heading: HeadingLevel.HEADING_2,
						spacing: { before: 200, after: 100 }
					})
				);
				item.controls.forEach((control, i) => {
					children.push(
						new Paragraph({
							text: `${item.riskIndex}.${i + 1} ${generateProtocolText(control)}`,
							spacing: { after: 150 }
						})
					);
				});
			}
		}

		const doc = new Document({
			sections: [{
				properties: {},
				children
			}]
		});

		const blob = await Packer.toBlob(doc);
		saveAs(blob, `AI-Protocol-${phaseName}-${new Date().toISOString().split('T')[0]}.docx`);
	}

	function copyMarkdown() {
		let md = `# AI Research Protocol - Risk Mitigation Plan\n\n`;
		md += `**Phase:** ${phaseName}\n`;
		md += `**Model Types:** ${selectedModelTypes.join(', ') || 'Not specified'}\n`;
		md += `**Date:** ${new Date().toLocaleDateString()}\n`;
		md += `**Controls Selected:** ${totalSelectedControls}\n\n---\n\n`;

		// Group controls by status within each risk
		const hasImplemented = protocolItems.some(i => i.controls.some(c => c.status === 'implemented'));
		const hasInProtocol = protocolItems.some(i => i.controls.some(c => c.status === 'in-protocol'));
		const hasPostPhase = protocolItems.some(i => i.controls.some(c => c.status === 'post-phase'));
		const hasNotRequired = protocolItems.some(i => i.controls.some(c => c.status === 'not-required'));

		if (hasImplemented) {
			md += `## Already Implemented Controls\n\n`;
			for (const item of protocolItems) {
				const controls = item.controls.filter(c => c.status === 'implemented');
				if (controls.length > 0) {
					md += `### ${item.riskIndex}. ${item.risk.subdomain.shortName}\n\n`;
					controls.forEach((control, i) => {
						md += `${item.riskIndex}.${i + 1} ${generateProtocolText(control)}\n\n`;
					});
				}
			}
		}

		if (hasInProtocol) {
			md += `## Controls to be Implemented in This Protocol\n\n`;
			for (const item of protocolItems) {
				const controls = item.controls.filter(c => c.status === 'in-protocol');
				if (controls.length > 0) {
					md += `### ${item.riskIndex}. ${item.risk.subdomain.shortName}\n\n`;
					controls.forEach((control, i) => {
						md += `${item.riskIndex}.${i + 1} ${generateProtocolText(control)}\n\n`;
					});
				}
			}
		}

		if (hasPostPhase) {
			md += `## Controls Planned for Post-Phase Implementation\n\n`;
			for (const item of protocolItems) {
				const controls = item.controls.filter(c => c.status === 'post-phase');
				if (controls.length > 0) {
					md += `### ${item.riskIndex}. ${item.risk.subdomain.shortName}\n\n`;
					controls.forEach((control, i) => {
						md += `${item.riskIndex}.${i + 1} ${generateProtocolText(control)}\n\n`;
					});
				}
			}
		}

		if (hasNotRequired) {
			md += `## Controls Evaluated as Not Required\n\n`;
			for (const item of protocolItems) {
				const controls = item.controls.filter(c => c.status === 'not-required');
				if (controls.length > 0) {
					md += `### ${item.riskIndex}. ${item.risk.subdomain.shortName}\n\n`;
					controls.forEach((control, i) => {
						md += `${item.riskIndex}.${i + 1} ${generateProtocolText(control)}\n\n`;
					});
				}
			}
		}

		navigator.clipboard.writeText(md);
		alert('Protocol copied to clipboard as Markdown.');
	}
</script>

<svelte:head>
	<title>Protocol Builder - AI Oversight Tools</title>
</svelte:head>

<div class="builder">
	<header class="builder-header">
		<div class="header-left">
			<h1>Protocol Builder</h1>
			<span class="subtitle">AI Risk Mitigation for Human Subjects Research</span>
		</div>
		<div class="header-actions">
			{#if hasProtocolContent}
				<span class="control-count">{totalSelectedControls} controls selected</span>
				<button class="btn-outline" onclick={copyMarkdown}>Copy Markdown</button>
				<button class="btn-primary" onclick={exportDocx}>Export DOCX</button>
			{/if}
		</div>
	</header>

	<div class="builder-body">
		<!-- Assessment Sidebar -->
		<aside class="assessment-panel">
			<h2>Assessment</h2>
			{#each visibleCategories as category}
				<div class="question-section">
					<h3>{category.name}</h3>
					{#each category.questions as question}
						{#if checkShowIf(question.showIf)}
							<div class="question">
								<span class="question-label">{question.question}</span>
								<div class="question-options">
									{#if question.type === 'single-select'}
										{#each question.options as option}
											<button
												class="option-btn"
												class:active={answers[question.id] === option.value}
												onclick={() => answers[question.id] = option.value}
											>{option.label}</button>
										{/each}
									{:else if question.type === 'multi-select'}
										{#each question.options as option}
											<button
												class="option-btn"
												class:active={(answers[question.id] as string[] || []).includes(option.value)}
												onclick={() => toggleMulti(question.id, option.value)}
											>{option.label}</button>
										{/each}
									{:else if question.type === 'yes-no'}
										<button class="option-btn" class:active={answers[question.id] === 'yes'} onclick={() => answers[question.id] = 'yes'}>Yes</button>
										<button class="option-btn" class:active={answers[question.id] === 'no'} onclick={() => answers[question.id] = 'no'}>No</button>
									{/if}
								</div>
							</div>
						{/if}
					{/each}
				</div>
			{/each}
		</aside>

		<!-- Main Risk Selection -->
		<main class="risks-panel">
			{#if !selectedPhase}
				<div class="placeholder">
					<p>Select a development phase to identify applicable risks.</p>
				</div>
			{:else if triggeredRisks.length === 0}
				<div class="placeholder">
					<p>Answer more assessment questions to identify risks.</p>
				</div>
			{:else}
				<div class="risks-toolbar">
					<h2>Risks ({displayedRisks.length})</h2>
					<div class="toolbar-filters">
						<select class="filter-select" bind:value={appropriatenessFilter}>
							<option value="all">All Strategies</option>
							<option value="essential">Essential Only</option>
							<option value="essential-recommended">Essential + Recommended</option>
						</select>
						{#if risksWithUnaddressedEssential > 0}
							<label class="filter-checkbox">
								<input type="checkbox" bind:checked={showOnlyUnaddressed} />
								<span>Incomplete only ({risksWithUnaddressedEssential})</span>
							</label>
						{/if}
					</div>
				</div>

				<div class="defense-legend">
					<span><i class="dot-p"></i> Preventive</span>
					<span><i class="dot-d"></i> Detective</span>
					<span><i class="dot-c"></i> Corrective</span>
				</div>

				<div class="risks-list">
					{#each displayedRisks as risk}
						{@const isExpanded = expandedRisks.has(risk.subdomain.id)}
						{@const controlCount = getControlCount(risk.subdomain.id)}
						{@const coverage = getDefenseCoverage(risk.subdomain.id, risk.linkedStrategies)}
						{@const essentialCoverage = getEssentialCoverage(risk.subdomain.id, risk.linkedStrategies)}
						<div class="risk-card" class:addressed={controlCount > 0}>
							<button class="risk-header" onclick={() => toggleRiskExpanded(risk.subdomain.id)}>
								<span class="risk-name">{risk.subdomain.shortName}</span>
								<span class="risk-meta">
									<span class="defense-coverage">
										<i class="dot-p" class:active={coverage.preventive}></i>
										<i class="dot-d" class:active={coverage.detective}></i>
										<i class="dot-c" class:active={coverage.corrective}></i>
									</span>
									{#if controlCount > 0}
										<span class="control-badge">{controlCount}</span>
									{/if}
									{#if essentialCoverage.hasEssential && !essentialCoverage.complete}
										<span class="essential-gap">{essentialCoverage.total - essentialCoverage.selected} ess.</span>
									{/if}
									<span class="toggle-icon">{isExpanded ? '−' : '+'}</span>
								</span>
							</button>

							{#if isExpanded}
								{@const essentialStrategies = risk.linkedStrategies.filter((s: any) => getAppropriateness(s) === 'essential')}
								{@const otherStrategies = risk.linkedStrategies.filter((s: any) => getAppropriateness(s) !== 'essential')}
								<div class="risk-content">
									{#if risk.riskContext}
										<p class="risk-description">{risk.riskContext}</p>
									{/if}

									{#snippet strategyRow(strategy: any, risk: any)}
										{@const appropriateness = getAppropriateness(strategy)}
										{@const strategyControls = getControlsForStrategy(strategy.id)}
										{@const selectedInStrategy = strategyControls.filter((c: any) => isControlSelected(c.id, risk.subdomain.id, strategy.id)).length}
										<div class="strategy-item" class:has-selections={selectedInStrategy > 0}>
											<div class="strategy-main">
												<span class="strategy-name">{strategy.name}</span>
												<span class="badge badge-{strategy.defenseLayer}">{strategy.defenseLayer.charAt(0).toUpperCase()}</span>
												{#if selectedInStrategy > 0}
													<span class="selected-indicator">{selectedInStrategy}</span>
												{/if}
												<button
													class="controls-btn"
													onclick={() => toggleControlsPanel(strategy.id)}
												>
													{strategyControls.length} {showControlsFor === strategy.id ? '▲' : '▼'}
												</button>
											</div>
											{#if showControlsFor === strategy.id}
												<div class="controls-drawer">
													<div class="controls-toolbar">
														<input
															type="text"
															class="controls-search"
															placeholder="Search..."
															bind:value={controlSearch}
														/>
														<select class="source-filter" bind:value={sourceFilter}>
															<option value="all">All sources</option>
															<option value="regulatory">Regulatory</option>
															<option value="academic">Academic</option>
														</select>
													</div>
													<div class="controls-list">
														{#each strategyControls as control}
															{@const key = makeControlKey(control.id, risk.subdomain.id, strategy.id)}
															{@const selection = getControlSelection(control.id, risk.subdomain.id, strategy.id)}
															{@const isSelected = !!selection}
															{@const implNote = control.implementationNotes?.[selectedPhase]}
															<div class="control-row" class:selected={isSelected}>
																<div class="control-header">
																	<input
																		type="checkbox"
																		checked={isSelected}
																		onchange={() => toggleControl(control, risk, strategy)}
																	/>
																	<strong>{control.name}</strong>
																	<span class="source-badge" class:regulatory={isRegulatory(control.source)}>{getSourceLabel(control.source)}</span>
																</div>
																{#if implNote}
																	<p class="impl-note">{implNote}</p>
																{:else if control.description}
																	<p class="control-desc">{control.description}</p>
																{/if}
																{#if isSelected && selection}
																	<div class="control-config">
																		<div class="status-buttons">
																			{#each Object.entries(statusLabels) as [status, label]}
																				<button
																					class="status-btn"
																					class:active={selection.status === status}
																					style:--status-color={statusColors[status as ImplementationStatus]}
																					onclick={() => updateControlStatus(key, status as ImplementationStatus)}
																				>{label}</button>
																			{/each}
																		</div>
																		<div class="notes-row">
																			{#if editingControlNotes === key}
																				<textarea
																					class="notes-input"
																					placeholder={selection.status === 'not-required' ? 'Justification for why this control is not required...' : 'Implementation notes or details...'}
																					value={selection.notes}
																					oninput={(e) => updateControlNotes(key, (e.target as HTMLTextAreaElement).value)}
																					onblur={() => editingControlNotes = null}
																				></textarea>
																			{:else}
																				<button
																					class="add-notes-btn"
																					onclick={() => editingControlNotes = key}
																				>
																					{selection.notes ? 'Edit notes' : (selection.status === 'not-required' ? '+ Add justification' : '+ Add notes')}
																				</button>
																				{#if selection.notes}
																					<span class="notes-preview">{selection.notes.slice(0, 50)}{selection.notes.length > 50 ? '...' : ''}</span>
																				{/if}
																			{/if}
																		</div>
																	</div>
																{/if}
															</div>
														{:else}
															<p class="no-results">No controls match your search.</p>
														{/each}
													</div>
												</div>
											{/if}
										</div>
									{/snippet}

									<!-- Essential strategies first -->
									{#if essentialStrategies.length > 0 && (appropriatenessFilter === 'all' || appropriatenessFilter === 'essential' || appropriatenessFilter === 'essential-recommended')}
										<div class="strategy-group essential-group">
											<h4>Essential</h4>
											{#each essentialStrategies as strategy}
												{@render strategyRow(strategy, risk)}
											{/each}
										</div>
									{/if}

									<!-- Other strategies grouped by category -->
									{#if appropriatenessFilter !== 'essential'}
										{#each data.mitigationCategories as category}
											{@const catStrategies = otherStrategies.filter((s: any) => {
												if (s.categoryId !== category.id) return false;
												const app = getAppropriateness(s);
												if (appropriatenessFilter === 'recommended') return app === 'recommended';
												if (appropriatenessFilter === 'essential-recommended') return app === 'recommended';
												return true;
											})}
											{#if catStrategies.length > 0}
												<div class="strategy-group">
													<h4>{category.name}</h4>
													{#each catStrategies as strategy}
														{@render strategyRow(strategy, risk)}
													{/each}
												</div>
											{/if}
										{/each}
									{/if}
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</main>

		<!-- Protocol Preview -->
		<aside class="protocol-panel">
			<div class="protocol-doc">
				<div class="doc-header">
					<h2>AI Research Protocol</h2>
					<span>Risk Mitigation Plan</span>
				</div>
				<table class="doc-meta">
					<tbody>
						<tr><td>Phase</td><td>{phaseName || '—'}</td></tr>
						<tr><td>Model Types</td><td>{selectedModelTypes.join(', ') || '—'}</td></tr>
						<tr><td>Risks Addressed</td><td>{risksAddressed} / {triggeredRisks.length}</td></tr>
						<tr><td>Controls</td><td>{totalSelectedControls}</td></tr>
					</tbody>
				</table>

				{#if !hasProtocolContent}
					<p class="doc-empty">Select controls from the risk strategies to build your protocol.</p>
				{:else}
					<div class="doc-content">
						{#if implementedControls.length > 0}
							<section>
								<h3>Already Implemented</h3>
								{#each protocolItems as item}
									{@const riskImplemented = item.controls.filter(c => c.status === 'implemented')}
									{#if riskImplemented.length > 0}
										<div class="doc-risk">
											<h4>{item.riskIndex}. {item.risk.subdomain.shortName}</h4>
											{#each riskImplemented as control, i}
												<p class="doc-control">{item.riskIndex}.{i + 1} {generateProtocolText(control)}</p>
											{/each}
										</div>
									{/if}
								{/each}
							</section>
						{/if}

						{#if inProtocolControls.length > 0}
							<section>
								<h3>In This Protocol</h3>
								{#each protocolItems as item}
									{@const riskInProtocol = item.controls.filter(c => c.status === 'in-protocol')}
									{#if riskInProtocol.length > 0}
										<div class="doc-risk">
											<h4>{item.riskIndex}. {item.risk.subdomain.shortName}</h4>
											{#each riskInProtocol as control, i}
												<p class="doc-control">{item.riskIndex}.{i + 1} {generateProtocolText(control)}</p>
											{/each}
										</div>
									{/if}
								{/each}
							</section>
						{/if}

						{#if postPhaseControls.length > 0}
							<section>
								<h3>Post-Phase Implementation</h3>
								{#each protocolItems as item}
									{@const riskPostPhase = item.controls.filter(c => c.status === 'post-phase')}
									{#if riskPostPhase.length > 0}
										<div class="doc-risk">
											<h4>{item.riskIndex}. {item.risk.subdomain.shortName}</h4>
											{#each riskPostPhase as control, i}
												<p class="doc-control">{item.riskIndex}.{i + 1} {generateProtocolText(control)}</p>
											{/each}
										</div>
									{/if}
								{/each}
							</section>
						{/if}

						{#if notRequiredControls.length > 0}
							<section>
								<h3>Not Required</h3>
								{#each protocolItems as item}
									{@const riskNotRequired = item.controls.filter(c => c.status === 'not-required')}
									{#if riskNotRequired.length > 0}
										<div class="doc-risk not-required">
											<h4>{item.riskIndex}. {item.risk.subdomain.shortName}</h4>
											{#each riskNotRequired as control, i}
												<p class="doc-control">{item.riskIndex}.{i + 1} {generateProtocolText(control)}</p>
											{/each}
										</div>
									{/if}
								{/each}
							</section>
						{/if}
					</div>
				{/if}
			</div>
		</aside>
	</div>
</div>

<style>
	.builder {
		display: flex;
		flex-direction: column;
		height: calc(100vh - 80px);
		background: #0f172a;
		color: #e2e8f0;
	}

	/* Header */
	.builder-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1rem;
		background: #1e293b;
		border-bottom: 1px solid #334155;
	}

	.header-left h1 {
		font-size: 1rem;
		font-weight: 600;
		margin: 0;
	}

	.subtitle {
		font-size: 0.6875rem;
		color: #64748b;
	}

	.header-actions {
		display: flex;
		gap: 0.75rem;
		align-items: center;
	}

	.control-count {
		font-size: 0.75rem;
		color: #22c55e;
		font-weight: 500;
	}

	.btn-outline, .btn-primary {
		padding: 0.375rem 0.75rem;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 500;
		cursor: pointer;
	}

	.btn-outline {
		background: transparent;
		border: 1px solid #475569;
		color: #cbd5e1;
	}

	.btn-outline:hover {
		border-color: #64748b;
		background: #1e293b;
	}

	.btn-primary {
		background: #3b82f6;
		border: 1px solid #3b82f6;
		color: white;
	}

	.btn-primary:hover {
		background: #2563eb;
	}

	/* Body */
	.builder-body {
		display: grid;
		grid-template-columns: 260px 1fr 380px;
		flex: 1;
		overflow: hidden;
	}

	/* Assessment Panel */
	.assessment-panel {
		background: #1e293b;
		border-right: 1px solid #334155;
		padding: 1rem;
		overflow-y: auto;
	}

	.assessment-panel h2 {
		font-size: 0.625rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: #64748b;
		margin: 0 0 1rem 0;
	}

	.question-section {
		margin-bottom: 1rem;
	}

	.question-section h3 {
		font-size: 0.6875rem;
		font-weight: 600;
		color: #94a3b8;
		margin: 0 0 0.5rem 0;
	}

	.question {
		margin-bottom: 0.75rem;
	}

	.question-label {
		display: block;
		font-size: 0.6875rem;
		color: #cbd5e1;
		margin-bottom: 0.375rem;
	}

	.question-options {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
	}

	.option-btn {
		padding: 0.25rem 0.5rem;
		font-size: 0.625rem;
		background: #0f172a;
		border: 1px solid #334155;
		border-radius: 3px;
		color: #94a3b8;
		cursor: pointer;
	}

	.option-btn:hover {
		border-color: #475569;
		color: #e2e8f0;
	}

	.option-btn.active {
		background: #3b82f6;
		border-color: #3b82f6;
		color: white;
	}

	/* Risks Panel */
	.risks-panel {
		background: #0f172a;
		overflow-y: auto;
		padding: 1rem;
	}

	.placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: #64748b;
		font-size: 0.875rem;
	}

	.risks-toolbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.risks-toolbar h2 {
		font-size: 0.8125rem;
		font-weight: 600;
		margin: 0;
	}

	.defense-legend {
		display: flex;
		gap: 0.75rem;
		font-size: 0.625rem;
		color: #64748b;
	}

	.defense-legend span {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.dot-p, .dot-d, .dot-c {
		display: inline-block;
		width: 8px;
		height: 8px;
		border-radius: 2px;
		border: 1px solid;
	}

	.dot-p { border-color: #3b82f6; background: transparent; }
	.dot-d { border-color: #f59e0b; background: transparent; }
	.dot-c { border-color: #ef4444; background: transparent; }

	.dot-p.active { background: #3b82f6; }
	.dot-d.active { background: #f59e0b; }
	.dot-c.active { background: #ef4444; }

	/* Risk Cards */
	.risks-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.risk-card {
		background: #1e293b;
		border: 1px solid #334155;
		border-radius: 6px;
	}

	.risk-card.addressed {
		border-color: #22c55e;
	}

	.risk-header {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 0.75rem;
		background: transparent;
		border: none;
		cursor: pointer;
		text-align: left;
		color: inherit;
	}

	.risk-header:hover {
		background: #334155;
	}

	.risk-name {
		flex: 1;
		font-size: 0.8125rem;
		font-weight: 500;
	}

	.risk-meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.defense-coverage {
		display: flex;
		gap: 2px;
	}

	.control-badge {
		font-size: 0.625rem;
		font-weight: 600;
		color: #22c55e;
		background: rgba(34, 197, 94, 0.15);
		padding: 0.125rem 0.375rem;
		border-radius: 3px;
	}

	.toggle-icon {
		color: #64748b;
		font-size: 0.875rem;
	}

	.risk-content {
		padding: 0 0.75rem 0.75rem;
		border-top: 1px solid #334155;
	}

	.risk-description {
		font-size: 0.75rem;
		color: #94a3b8;
		line-height: 1.5;
		margin: 0.75rem 0;
	}

	/* Strategy Groups */
	.strategy-group {
		margin-bottom: 0.75rem;
	}

	.strategy-group h4 {
		font-size: 0.625rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #64748b;
		margin: 0 0 0.5rem 0;
	}

	.strategy-item {
		background: #0f172a;
		border: 1px solid #334155;
		border-radius: 4px;
		margin-bottom: 0.375rem;
	}

	.strategy-item.has-selections {
		border-color: #22c55e;
	}

	.strategy-main {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem;
	}

	.strategy-name {
		flex: 1;
		font-size: 0.75rem;
	}

	.badge {
		font-size: 0.5rem;
		font-weight: 600;
		padding: 0.125rem 0.25rem;
		border-radius: 2px;
	}

	.badge-preventive { background: #3b82f6; color: white; }
	.badge-detective { background: #f59e0b; color: black; }
	.badge-corrective { background: #ef4444; color: white; }
	.badge-essential { background: #22c55e; color: black; }
	.badge-recommended { background: #60a5fa; color: black; }
	.badge-overkill { background: #ef4444; color: white; }

	.selected-indicator {
		font-size: 0.625rem;
		color: #22c55e;
	}

	.controls-btn {
		font-size: 0.625rem;
		color: #60a5fa;
		background: transparent;
		border: none;
		cursor: pointer;
		padding: 0.25rem;
	}

	.controls-btn:hover {
		text-decoration: underline;
	}

	.controls-drawer {
		border-top: 1px solid #334155;
		padding: 0.5rem;
		background: #1e293b;
	}

	.controls-toolbar {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.controls-search {
		flex: 1;
		padding: 0.375rem 0.5rem;
		font-size: 0.6875rem;
		background: #0f172a;
		border: 1px solid #334155;
		border-radius: 3px;
		color: #e2e8f0;
	}

	.controls-search::placeholder {
		color: #64748b;
	}

	.source-filter {
		padding: 0.375rem 0.5rem;
		font-size: 0.6875rem;
		background: #0f172a;
		border: 1px solid #334155;
		border-radius: 3px;
		color: #e2e8f0;
		cursor: pointer;
	}

	.controls-list {
		max-height: 300px;
		overflow-y: auto;
	}

	.control-row {
		padding: 0.5rem;
		border: 1px solid #334155;
		border-radius: 4px;
		margin-bottom: 0.375rem;
		background: #0f172a;
	}

	.control-row.selected {
		border-color: #3b82f6;
		background: rgba(59, 130, 246, 0.1);
	}

	.control-header {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
	}

	.control-header input[type="checkbox"] {
		margin-top: 2px;
		flex-shrink: 0;
	}

	.control-header strong {
		font-size: 0.6875rem;
		color: #e2e8f0;
		font-weight: 600;
		flex: 1;
	}

	.source-badge {
		font-size: 0.5rem;
		padding: 0.125rem 0.25rem;
		border-radius: 2px;
		background: #334155;
		color: #94a3b8;
		flex-shrink: 0;
	}

	.source-badge.regulatory {
		background: #1e3a5f;
		color: #60a5fa;
	}

	.impl-note {
		margin: 0.375rem 0 0 1.25rem;
		font-size: 0.625rem;
		color: #22c55e;
		line-height: 1.4;
		font-style: italic;
	}

	.control-desc {
		margin: 0.375rem 0 0 1.25rem;
		font-size: 0.625rem;
		color: #64748b;
		line-height: 1.4;
	}

	.control-config {
		margin-top: 0.5rem;
		padding-top: 0.5rem;
		border-top: 1px solid #334155;
		margin-left: 1.25rem;
	}

	.status-buttons {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
	}

	.status-btn {
		font-size: 0.5625rem;
		padding: 0.25rem 0.5rem;
		border: 1px solid #475569;
		background: transparent;
		color: #94a3b8;
		border-radius: 3px;
		cursor: pointer;
	}

	.status-btn:hover {
		border-color: var(--status-color);
		color: var(--status-color);
	}

	.status-btn.active {
		background: var(--status-color);
		border-color: var(--status-color);
		color: white;
	}

	.notes-row {
		margin-top: 0.375rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.add-notes-btn {
		font-size: 0.5625rem;
		color: #60a5fa;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
	}

	.add-notes-btn:hover {
		text-decoration: underline;
	}

	.notes-preview {
		font-size: 0.5625rem;
		color: #64748b;
		font-style: italic;
	}

	.notes-input {
		width: 100%;
		min-height: 50px;
		padding: 0.375rem;
		font-size: 0.625rem;
		background: #0f172a;
		border: 1px solid #475569;
		border-radius: 3px;
		color: #e2e8f0;
		resize: vertical;
	}

	.notes-input::placeholder {
		color: #64748b;
	}

	.no-results {
		color: #64748b;
		font-size: 0.6875rem;
		text-align: center;
		padding: 1rem;
	}

	/* Protocol Panel */
	.protocol-panel {
		background: #475569;
		padding: 1rem;
		overflow-y: auto;
	}

	.protocol-doc {
		background: white;
		color: #1e293b;
		border-radius: 4px;
		padding: 1.5rem;
		min-height: 100%;
		box-shadow: 0 4px 12px rgba(0,0,0,0.3);
	}

	.doc-header {
		text-align: center;
		padding-bottom: 0.75rem;
		border-bottom: 2px solid #1e293b;
		margin-bottom: 1rem;
	}

	.doc-header h2 {
		font-size: 1rem;
		font-weight: 700;
		margin: 0;
		color: #0f172a;
	}

	.doc-header span {
		font-size: 0.75rem;
		color: #64748b;
	}

	.doc-meta {
		width: 100%;
		font-size: 0.6875rem;
		border-collapse: collapse;
		margin-bottom: 1rem;
	}

	.doc-meta td {
		padding: 0.25rem 0.5rem;
		border: 1px solid #e2e8f0;
	}

	.doc-meta td:first-child {
		font-weight: 600;
		background: #f8fafc;
		width: 40%;
	}

	.doc-empty {
		text-align: center;
		color: #64748b;
		font-size: 0.75rem;
		padding: 2rem 1rem;
	}

	.doc-content section {
		margin-bottom: 1.25rem;
	}

	.doc-content h3 {
		font-size: 0.8125rem;
		font-weight: 700;
		color: #0f172a;
		border-bottom: 1px solid #e2e8f0;
		padding-bottom: 0.25rem;
		margin: 0 0 0.75rem 0;
	}

	.doc-risk {
		margin-bottom: 1rem;
	}

	.doc-risk.not-required {
		opacity: 0.7;
	}

	.doc-risk h4 {
		font-size: 0.75rem;
		font-weight: 600;
		color: #334155;
		margin: 0 0 0.5rem 0;
	}

	.doc-control {
		font-size: 0.6875rem;
		line-height: 1.5;
		color: #475569;
		margin: 0 0 0.5rem 0.75rem;
		padding-left: 0.5rem;
		border-left: 2px solid #e2e8f0;
	}

	/* Toolbar Filters */
	.toolbar-filters {
		display: flex;
		gap: 0.75rem;
		align-items: center;
	}

	.filter-select {
		padding: 0.375rem 0.5rem;
		font-size: 0.6875rem;
		background: #1e293b;
		border: 1px solid #475569;
		border-radius: 4px;
		color: #e2e8f0;
		cursor: pointer;
	}

	.filter-select:hover {
		border-color: #64748b;
	}

	.filter-checkbox {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.6875rem;
		color: #94a3b8;
		cursor: pointer;
	}

	.filter-checkbox input {
		cursor: pointer;
	}

	/* Essential group styling */
	.essential-group h4 {
		color: #22c55e;
	}

	/* Subtle indicator for missing essentials */
	.essential-gap {
		font-size: 0.5625rem;
		color: #94a3b8;
	}

	/* Focus states for accessibility */
	.btn-outline:focus-visible, .btn-primary:focus-visible {
		outline: var(--focus-ring-width, 2px) solid var(--focus-ring-color, #60a5fa);
		outline-offset: var(--focus-ring-offset, 2px);
	}

	.option-btn:focus-visible {
		outline: var(--focus-ring-width, 2px) solid var(--focus-ring-color, #60a5fa);
		outline-offset: var(--focus-ring-offset, 2px);
	}

	.risk-header:focus-visible {
		outline: var(--focus-ring-width, 2px) solid var(--focus-ring-color, #60a5fa);
		outline-offset: var(--focus-ring-offset, 2px);
	}

	.filter-select:focus-visible {
		outline: var(--focus-ring-width, 2px) solid var(--focus-ring-color, #60a5fa);
		outline-offset: var(--focus-ring-offset, 2px);
	}

	.filter-checkbox input:focus-visible {
		outline: var(--focus-ring-width, 2px) solid var(--focus-ring-color, #60a5fa);
		outline-offset: var(--focus-ring-offset, 2px);
	}
</style>
