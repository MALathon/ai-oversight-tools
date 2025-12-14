<script lang="ts">
	import { base } from '$app/paths';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Editable data - deep clone to avoid mutating original
	let questions = $state(JSON.parse(JSON.stringify(data.questions)));
	let mitigations = $state(JSON.parse(JSON.stringify(data.phaseMitigations)));

	// Library status tracking (which risks are "published")
	let libraryStatus = $state<Record<string, 'draft' | 'published'>>({});

	// UI State
	let selectedRiskId = $state<string | null>(null);
	let showAddTriggerModal = $state(false);
	let pendingDelete = $state<{questionId: string, answerValue: string, subdomainId: string} | null>(null);
	let searchQuery = $state('');
	let filterDomain = $state<string | null>(null);

	// Build risk list from domains/subdomains
	let risks = $derived(
		data.domains.flatMap((d: any) =>
			d.subdomains.map((subId: string) => {
				const sub = data.subdomains.find((s: any) => s.id === subId);
				return sub ? { ...sub, domainId: d.id, domainName: d.name, domainCode: d.code } : null;
			}).filter(Boolean)
		)
	);

	// Get unique domains for filtering
	let domains = $derived(data.domains.map((d: any) => ({ id: d.id, name: d.name, code: d.code })));

	// Filter risks based on search and domain
	let filteredRisks = $derived.by(() => {
		return risks.filter((risk: any) => {
			const matchesSearch = searchQuery === '' ||
				risk.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				risk.shortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
				risk.code.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesDomain = filterDomain === null || risk.domainId === filterDomain;
			return matchesSearch && matchesDomain;
		});
	});

	// Get selected risk data
	let selectedRisk = $derived(risks.find((r: any) => r.id === selectedRiskId));

	// Get triggers for a specific subdomain
	function getTriggersForRisk(riskId: string) {
		const triggers: Array<{
			questionId: string;
			questionText: string;
			answerValue: string;
			answerLabel: string;
			categoryName: string;
		}> = [];

		for (const cat of questions.questionCategories) {
			for (const q of cat.questions) {
				if (!q.triggers) continue;
				for (const [answerValue, subIds] of Object.entries(q.triggers)) {
					if (answerValue === '_note') continue;
					if ((subIds as string[]).includes(riskId)) {
						let answerLabel = answerValue;
						if (q.type === 'yes-no') {
							answerLabel = answerValue === 'yes' ? 'Yes' : 'No';
						} else if (q.options) {
							const opt = q.options.find((o: any) => o.value === answerValue);
							if (opt) answerLabel = opt.label;
						}
						triggers.push({
							questionId: q.id,
							questionText: q.question,
							answerValue,
							answerLabel,
							categoryName: cat.name
						});
					}
				}
			}
		}
		return triggers;
	}

	// Get trigger count for display in list
	function getTriggerCount(riskId: string) {
		return getTriggersForRisk(riskId).length;
	}

	// Build list of available questions/answers for adding triggers
	let availableQuestionAnswers = $derived.by(() => {
		const items: Array<{
			questionId: string;
			questionText: string;
			answerValue: string;
			answerLabel: string;
			categoryName: string;
		}> = [];

		for (const cat of questions.questionCategories) {
			for (const q of cat.questions) {
				if (q.type === 'yes-no') {
					items.push({
						questionId: q.id,
						questionText: q.question,
						answerValue: 'yes',
						answerLabel: 'Yes',
						categoryName: cat.name
					});
				} else if (q.options) {
					for (const opt of q.options) {
						if (opt.value === 'none') continue;
						items.push({
							questionId: q.id,
							questionText: q.question,
							answerValue: opt.value,
							answerLabel: opt.label,
							categoryName: cat.name
						});
					}
				}
			}
		}
		return items;
	});

	// Check if a question/answer is already a trigger for selected risk
	function isAlreadyTrigger(questionId: string, answerValue: string) {
		if (!selectedRiskId) return false;
		const triggers = getTriggersForRisk(selectedRiskId);
		return triggers.some(t => t.questionId === questionId && t.answerValue === answerValue);
	}

	// Add a trigger
	function addTrigger(questionId: string, answerValue: string) {
		if (!selectedRiskId) return;

		for (const cat of questions.questionCategories) {
			for (const q of cat.questions) {
				if (q.id === questionId) {
					if (!q.triggers) q.triggers = {};
					if (!q.triggers[answerValue]) q.triggers[answerValue] = [];
					if (!q.triggers[answerValue].includes(selectedRiskId)) {
						q.triggers[answerValue] = [...q.triggers[answerValue], selectedRiskId];
					}
					showAddTriggerModal = false;
					return;
				}
			}
		}
	}

	// Remove a trigger (called after confirmation)
	function confirmRemoveTrigger() {
		if (!pendingDelete) return;
		const { questionId, answerValue, subdomainId } = pendingDelete;

		for (const cat of questions.questionCategories) {
			for (const q of cat.questions) {
				if (q.id === questionId && q.triggers && q.triggers[answerValue]) {
					q.triggers[answerValue] = q.triggers[answerValue].filter((id: string) => id !== subdomainId);
					break;
				}
			}
		}
		pendingDelete = null;
	}

	// Toggle library status
	function toggleLibraryStatus(riskId: string) {
		const current = libraryStatus[riskId] || 'draft';
		libraryStatus[riskId] = current === 'draft' ? 'published' : 'draft';
	}

	// Export configuration
	function exportConfig() {
		const phaseMitigationsOutput = {
			"$schema": "../schemas/phase-mitigations.schema.json",
			"version": "1.0.0",
			"source": "AIHSR Risk Reference Tool v1.5 (Tamiko Eto)",
			"lastUpdated": new Date().toISOString().split('T')[0],
			"description": "Phase-based mitigation strategy templates for each risk subdomain",
			"phaseMitigations": mitigations
		};

		const blob1 = new Blob([JSON.stringify(phaseMitigationsOutput, null, 2)], { type: 'application/json' });
		const url1 = URL.createObjectURL(blob1);
		const a1 = document.createElement('a');
		a1.href = url1;
		a1.download = 'phase-mitigations.json';
		a1.click();
		URL.revokeObjectURL(url1);

		setTimeout(() => {
			const questionsOutput = {
				...questions,
				"$schema": "./schemas/assessment-questions.schema.json",
				"version": "1.1.0",
				"lastUpdated": new Date().toISOString().split('T')[0]
			};
			const blob2 = new Blob([JSON.stringify(questionsOutput, null, 2)], { type: 'application/json' });
			const url2 = URL.createObjectURL(blob2);
			const a2 = document.createElement('a');
			a2.href = url2;
			a2.download = 'assessment-questions.json';
			a2.click();
			URL.revokeObjectURL(url2);
		}, 500);
	}

	// Get status badge color
	function getStatusInfo(riskId: string) {
		const triggerCount = getTriggerCount(riskId);
		const status = libraryStatus[riskId] || 'draft';
		const hasMitigations = mitigations[riskId] &&
			(mitigations[riskId]['phase-1'] || mitigations[riskId]['phase-2'] || mitigations[riskId]['phase-3']);

		if (status === 'published') return { label: 'Published', color: 'green' };
		if (triggerCount > 0 && hasMitigations) return { label: 'Ready', color: 'blue' };
		if (triggerCount > 0) return { label: 'Partial', color: 'yellow' };
		return { label: 'Draft', color: 'gray' };
	}
</script>

<svelte:head>
	<title>Risk Library Admin - AI Oversight Tools</title>
</svelte:head>

<div class="admin-layout">
	<!-- Left Panel: Risk List -->
	<div class="risk-list-panel">
		<div class="panel-header">
			<h1>Risk Library</h1>
			<button class="btn primary" onclick={exportConfig}>Export Config</button>
		</div>

		<div class="filters">
			<input
				type="text"
				placeholder="Search risks..."
				bind:value={searchQuery}
				class="search-input"
			/>
			<select bind:value={filterDomain} class="domain-filter">
				<option value={null}>All Domains</option>
				{#each domains as domain}
					<option value={domain.id}>{domain.code} - {domain.name}</option>
				{/each}
			</select>
		</div>

		<div class="risk-list">
			{#each filteredRisks as risk}
				{@const status = getStatusInfo(risk.id)}
				{@const triggerCount = getTriggerCount(risk.id)}
				<button
					class="risk-card"
					class:selected={selectedRiskId === risk.id}
					onclick={() => selectedRiskId = risk.id}
				>
					<div class="risk-header">
						<span class="risk-code">{risk.code}</span>
						<span class="status-badge {status.color}">{status.label}</span>
					</div>
					<div class="risk-name">{risk.shortName}</div>
					<div class="risk-meta">
						<span class="domain-tag">{risk.domainCode}</span>
						<span class="trigger-count">{triggerCount} trigger{triggerCount !== 1 ? 's' : ''}</span>
					</div>
				</button>
			{/each}

			{#if filteredRisks.length === 0}
				<div class="empty-state">No risks match your filters</div>
			{/if}
		</div>
	</div>

	<!-- Right Panel: Risk Detail -->
	<div class="detail-panel">
		{#if selectedRisk}
			{@const currentTriggers = getTriggersForRisk(selectedRisk.id)}
			{@const status = getStatusInfo(selectedRisk.id)}

			<div class="detail-header">
				<div class="detail-title">
					<span class="detail-code">{selectedRisk.code}</span>
					<h2>{selectedRisk.name}</h2>
				</div>
				<button class="close-btn" onclick={() => selectedRiskId = null}>×</button>
			</div>

			<p class="detail-description">{selectedRisk.description}</p>

			<div class="detail-meta">
				<span class="domain-label">Domain: {selectedRisk.domainName}</span>
				<button
					class="library-toggle {status.color}"
					onclick={() => toggleLibraryStatus(selectedRisk.id)}
				>
					{libraryStatus[selectedRisk.id] === 'published' ? 'Unpublish from Library' : 'Publish to Library'}
				</button>
			</div>

			<!-- Triggers Section -->
			<div class="section">
				<div class="section-header">
					<h3>Triggers</h3>
					<button class="btn small" onclick={() => showAddTriggerModal = true}>+ Add Trigger</button>
				</div>
				<p class="section-hint">Question/answer combinations that activate this risk</p>

				{#if currentTriggers.length > 0}
					<div class="trigger-list">
						{#each currentTriggers as trigger}
							<div class="trigger-item">
								<div class="trigger-content">
									<span class="trigger-answer">{trigger.answerLabel}</span>
									<span class="trigger-question">{trigger.questionText}</span>
									<span class="trigger-category">{trigger.categoryName}</span>
								</div>
								<button
									class="remove-btn"
									onclick={() => pendingDelete = {
										questionId: trigger.questionId,
										answerValue: trigger.answerValue,
										subdomainId: selectedRisk.id
									}}
									title="Remove trigger"
								>
									×
								</button>
							</div>
						{/each}
					</div>
				{:else}
					<div class="empty-triggers">
						No triggers configured. Add one to activate this risk based on user responses.
					</div>
				{/if}
			</div>

			<!-- Mitigations Section -->
			<div class="section">
				<h3>Phase Mitigations</h3>
				<p class="section-hint">Suggested mitigation strategies for each development phase</p>

				{#if mitigations[selectedRisk.id]}
					<div class="mitigation-editors">
						<div class="mitigation-phase">
							<label for="phase1-{selectedRisk.id}">Phase 1: Discovery</label>
							<textarea
								id="phase1-{selectedRisk.id}"
								bind:value={mitigations[selectedRisk.id]['phase-1']}
								rows="4"
								placeholder="Enter mitigation guidance for Discovery phase..."
							></textarea>
						</div>
						<div class="mitigation-phase">
							<label for="phase2-{selectedRisk.id}">Phase 2: Validation</label>
							<textarea
								id="phase2-{selectedRisk.id}"
								bind:value={mitigations[selectedRisk.id]['phase-2']}
								rows="4"
								placeholder="Enter mitigation guidance for Validation phase..."
							></textarea>
						</div>
						<div class="mitigation-phase">
							<label for="phase3-{selectedRisk.id}">Phase 3: Deployment</label>
							<textarea
								id="phase3-{selectedRisk.id}"
								bind:value={mitigations[selectedRisk.id]['phase-3']}
								rows="4"
								placeholder="Enter mitigation guidance for Deployment phase..."
							></textarea>
						</div>
					</div>
				{:else}
					<div class="empty-mitigations">
						No mitigation data found for this risk.
					</div>
				{/if}
			</div>

		{:else}
			<div class="no-selection">
				<div class="no-selection-icon">📋</div>
				<h3>Select a Risk</h3>
				<p>Choose a risk from the list to view and edit its traceability configuration.</p>
			</div>
		{/if}
	</div>
</div>

<!-- Add Trigger Modal -->
{#if showAddTriggerModal && selectedRisk}
	<div class="modal-overlay" onclick={() => showAddTriggerModal = false}>
		<div class="modal" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h3>Add Trigger for {selectedRisk.code}</h3>
				<button class="close-btn" onclick={() => showAddTriggerModal = false}>×</button>
			</div>
			<p class="modal-hint">Select a question/answer that should trigger this risk:</p>

			<div class="trigger-options">
				{#each availableQuestionAnswers as qa}
					{@const alreadyAdded = isAlreadyTrigger(qa.questionId, qa.answerValue)}
					<button
						class="trigger-option"
						class:disabled={alreadyAdded}
						disabled={alreadyAdded}
						onclick={() => addTrigger(qa.questionId, qa.answerValue)}
					>
						<span class="option-answer">{qa.answerLabel}</span>
						<span class="option-question">{qa.questionText}</span>
						<span class="option-category">{qa.categoryName}</span>
						{#if alreadyAdded}
							<span class="already-added">Already added</span>
						{/if}
					</button>
				{/each}
			</div>
		</div>
	</div>
{/if}

<!-- Delete Confirmation Modal -->
{#if pendingDelete}
	<div class="modal-overlay" onclick={() => pendingDelete = null}>
		<div class="modal confirm-modal" onclick={(e) => e.stopPropagation()}>
			<h3>Remove Trigger?</h3>
			<p>Are you sure you want to remove this trigger? This will affect when this risk is shown to innovators.</p>
			<div class="modal-actions">
				<button class="btn" onclick={() => pendingDelete = null}>Cancel</button>
				<button class="btn danger" onclick={confirmRemoveTrigger}>Remove</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.admin-layout {
		display: grid;
		grid-template-columns: 350px 1fr;
		gap: 1.5rem;
		height: calc(100vh - 120px);
	}

	/* Left Panel - Risk List */
	.risk-list-panel {
		display: flex;
		flex-direction: column;
		background: #1e293b;
		border-radius: 0.5rem;
		overflow: hidden;
	}

	.panel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		border-bottom: 1px solid #334155;
	}

	.panel-header h1 {
		font-size: 1rem;
		color: #f1f5f9;
	}

	.filters {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		border-bottom: 1px solid #334155;
	}

	.search-input, .domain-filter {
		width: 100%;
		padding: 0.5rem 0.75rem;
		background: #0f172a;
		border: 1px solid #334155;
		border-radius: 0.375rem;
		color: #e2e8f0;
		font-size: 0.8125rem;
	}

	.search-input:focus, .domain-filter:focus {
		outline: none;
		border-color: #60a5fa;
	}

	.risk-list {
		flex: 1;
		overflow-y: auto;
		padding: 0.5rem;
	}

	.risk-card {
		width: 100%;
		text-align: left;
		padding: 0.75rem;
		background: #0f172a;
		border: 1px solid #334155;
		border-radius: 0.375rem;
		margin-bottom: 0.5rem;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.risk-card:hover {
		border-color: #475569;
	}

	.risk-card.selected {
		border-color: #60a5fa;
		background: rgba(96, 165, 250, 0.1);
	}

	.risk-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.25rem;
	}

	.risk-code {
		font-family: monospace;
		font-size: 0.75rem;
		color: #60a5fa;
		background: rgba(96, 165, 250, 0.2);
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
	}

	.status-badge {
		font-size: 0.625rem;
		font-weight: 600;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		text-transform: uppercase;
	}

	.status-badge.green { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
	.status-badge.blue { background: rgba(96, 165, 250, 0.2); color: #60a5fa; }
	.status-badge.yellow { background: rgba(251, 191, 36, 0.2); color: #fbbf24; }
	.status-badge.gray { background: rgba(100, 116, 139, 0.2); color: #64748b; }

	.risk-name {
		font-size: 0.875rem;
		color: #e2e8f0;
		margin-bottom: 0.375rem;
	}

	.risk-meta {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.domain-tag {
		font-size: 0.625rem;
		color: #64748b;
		background: #334155;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
	}

	.trigger-count {
		font-size: 0.6875rem;
		color: #64748b;
	}

	.empty-state {
		text-align: center;
		padding: 2rem;
		color: #64748b;
	}

	/* Right Panel - Detail */
	.detail-panel {
		background: #1e293b;
		border-radius: 0.5rem;
		padding: 1.5rem;
		overflow-y: auto;
	}

	.detail-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 0.75rem;
	}

	.detail-title {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.detail-code {
		font-family: monospace;
		font-size: 0.875rem;
		color: #60a5fa;
		background: rgba(96, 165, 250, 0.2);
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
	}

	.detail-header h2 {
		font-size: 1.125rem;
		color: #f1f5f9;
	}

	.close-btn {
		background: none;
		border: none;
		color: #64748b;
		font-size: 1.5rem;
		cursor: pointer;
		padding: 0;
		line-height: 1;
	}

	.close-btn:hover {
		color: #e2e8f0;
	}

	.detail-description {
		font-size: 0.875rem;
		color: #94a3b8;
		line-height: 1.5;
		margin-bottom: 1rem;
	}

	.detail-meta {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem;
		background: #0f172a;
		border-radius: 0.375rem;
		margin-bottom: 1.5rem;
	}

	.domain-label {
		font-size: 0.8125rem;
		color: #94a3b8;
	}

	.library-toggle {
		font-size: 0.75rem;
		padding: 0.375rem 0.75rem;
		border: none;
		border-radius: 0.25rem;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.library-toggle.green {
		background: rgba(34, 197, 94, 0.2);
		color: #22c55e;
	}

	.library-toggle.blue, .library-toggle.yellow, .library-toggle.gray {
		background: #334155;
		color: #e2e8f0;
	}

	.library-toggle:hover {
		opacity: 0.8;
	}

	/* Sections */
	.section {
		margin-bottom: 1.5rem;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.25rem;
	}

	.section h3 {
		font-size: 0.875rem;
		color: #60a5fa;
		font-weight: 600;
	}

	.section-hint {
		font-size: 0.75rem;
		color: #64748b;
		margin-bottom: 0.75rem;
	}

	/* Triggers */
	.trigger-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.trigger-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		background: #0f172a;
		border: 1px solid #334155;
		border-radius: 0.375rem;
	}

	.trigger-content {
		flex: 1;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
	}

	.trigger-answer {
		font-size: 0.75rem;
		font-weight: 600;
		color: #22c55e;
		background: rgba(34, 197, 94, 0.2);
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
	}

	.trigger-question {
		font-size: 0.8125rem;
		color: #e2e8f0;
	}

	.trigger-category {
		font-size: 0.6875rem;
		color: #64748b;
	}

	.remove-btn {
		background: none;
		border: none;
		color: #64748b;
		font-size: 1.25rem;
		cursor: pointer;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
	}

	.remove-btn:hover {
		background: rgba(239, 68, 68, 0.2);
		color: #ef4444;
	}

	.empty-triggers, .empty-mitigations {
		padding: 1rem;
		background: #0f172a;
		border: 1px dashed #334155;
		border-radius: 0.375rem;
		text-align: center;
		color: #64748b;
		font-size: 0.8125rem;
	}

	/* Mitigations */
	.mitigation-editors {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.mitigation-phase label {
		display: block;
		font-size: 0.75rem;
		font-weight: 600;
		color: #94a3b8;
		margin-bottom: 0.375rem;
	}

	.mitigation-phase textarea {
		width: 100%;
		padding: 0.75rem;
		background: #0f172a;
		border: 1px solid #334155;
		border-radius: 0.375rem;
		color: #e2e8f0;
		font-size: 0.8125rem;
		line-height: 1.5;
		resize: vertical;
	}

	.mitigation-phase textarea:focus {
		outline: none;
		border-color: #60a5fa;
	}

	/* No Selection State */
	.no-selection {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		text-align: center;
		color: #64748b;
	}

	.no-selection-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
		opacity: 0.5;
	}

	.no-selection h3 {
		font-size: 1.125rem;
		color: #94a3b8;
		margin-bottom: 0.5rem;
	}

	.no-selection p {
		font-size: 0.875rem;
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
		transition: all 0.15s ease;
	}

	.btn:hover {
		background: #475569;
	}

	.btn.primary {
		background: #60a5fa;
		color: #0f172a;
	}

	.btn.primary:hover {
		background: #3b82f6;
	}

	.btn.small {
		padding: 0.375rem 0.75rem;
		font-size: 0.75rem;
	}

	.btn.danger {
		background: #ef4444;
		color: white;
	}

	.btn.danger:hover {
		background: #dc2626;
	}

	/* Modals */
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
	}

	.modal {
		background: #1e293b;
		border: 1px solid #334155;
		border-radius: 0.5rem;
		max-width: 600px;
		max-height: 80vh;
		overflow: hidden;
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

	.modal-hint {
		padding: 0.75rem 1rem;
		font-size: 0.8125rem;
		color: #94a3b8;
		background: #0f172a;
	}

	.trigger-options {
		flex: 1;
		overflow-y: auto;
		padding: 0.5rem;
		max-height: 400px;
	}

	.trigger-option {
		width: 100%;
		text-align: left;
		padding: 0.75rem;
		background: #0f172a;
		border: 1px solid #334155;
		border-radius: 0.375rem;
		margin-bottom: 0.5rem;
		cursor: pointer;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
	}

	.trigger-option:hover:not(.disabled) {
		border-color: #60a5fa;
	}

	.trigger-option.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.option-answer {
		font-size: 0.75rem;
		font-weight: 600;
		color: #22c55e;
		background: rgba(34, 197, 94, 0.2);
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
	}

	.option-question {
		flex: 1;
		font-size: 0.8125rem;
		color: #e2e8f0;
	}

	.option-category {
		font-size: 0.6875rem;
		color: #64748b;
	}

	.already-added {
		font-size: 0.6875rem;
		color: #60a5fa;
		margin-left: auto;
	}

	.confirm-modal {
		padding: 1.5rem;
		max-width: 400px;
	}

	.confirm-modal h3 {
		font-size: 1.125rem;
		color: #f1f5f9;
		margin-bottom: 0.75rem;
	}

	.confirm-modal p {
		font-size: 0.875rem;
		color: #94a3b8;
		margin-bottom: 1.5rem;
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
	}

	/* Responsive */
	@media (max-width: 900px) {
		.admin-layout {
			grid-template-columns: 1fr;
		}

		.risk-list-panel {
			max-height: 300px;
		}
	}
</style>
