<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Build traceability: subdomain → what triggers it → mitigation text
	let traceability = $derived.by(() => {
		const trace: Record<string, {
			subdomain: any;
			domain: any;
			triggeredBy: Array<{ questionId: string; questionText: string; answerValue: string }>;
			mitigations: { 'phase-1': string; 'phase-2': string; 'phase-3': string };
		}> = {};

		// Initialize all subdomains that have mitigations
		for (const domain of data.domains) {
			for (const subId of domain.subdomains) {
				const sub = data.subdomains.find((s: any) => s.id === subId);
				const mitigations = data.phaseMitigations[subId];
				if (sub && mitigations) {
					trace[subId] = {
						subdomain: sub,
						domain,
						triggeredBy: [],
						mitigations
					};
				}
			}
		}

		// Find all triggers from questions
		for (const category of data.questions.questionCategories) {
			for (const question of category.questions) {
				if (!question.triggers) continue;
				for (const [answerValue, subdomainIds] of Object.entries(question.triggers)) {
					if (answerValue === '_note') continue;
					for (const subId of subdomainIds as string[]) {
						if (trace[subId]) {
							trace[subId].triggeredBy.push({
								questionId: question.id,
								questionText: question.question,
								answerValue
							});
						}
					}
				}
			}
		}

		return trace;
	});

	let selectedSubdomain = $state('');
	let filterText = $state('');

	let filteredSubdomains = $derived(
		Object.entries(traceability).filter(([id, data]) => {
			if (!filterText) return true;
			const search = filterText.toLowerCase();
			return (
				data.subdomain.name.toLowerCase().includes(search) ||
				data.subdomain.shortName.toLowerCase().includes(search) ||
				data.subdomain.code.includes(search) ||
				data.triggeredBy.some(t => t.questionText.toLowerCase().includes(search))
			);
		})
	);

	// Editable mitigations
	let editableMitigations = $state<Record<string, any>>({});

	function startEditing(subId: string) {
		editableMitigations[subId] = JSON.parse(JSON.stringify(traceability[subId].mitigations));
	}

	function cancelEditing(subId: string) {
		delete editableMitigations[subId];
	}

	function exportAll() {
		const output = {
			phaseMitigations: {} as Record<string, any>,
			questions: data.questions
		};

		for (const [subId, trace] of Object.entries(traceability)) {
			output.phaseMitigations[subId] = editableMitigations[subId] || trace.mitigations;
		}

		const blob = new Blob([JSON.stringify(output, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'ai-oversight-config.json';
		a.click();
		URL.revokeObjectURL(url);
	}
</script>

<svelte:head>
	<title>Admin - AI Oversight Tools</title>
</svelte:head>

<div class="admin">
	<div class="header">
		<div>
			<h1>Configuration Traceability</h1>
			<p>View and edit how questions trigger risk subdomains and their mitigation text</p>
		</div>
		<button class="export-btn" onclick={exportAll}>Export Config</button>
	</div>

	<div class="search">
		<input
			type="text"
			placeholder="Filter by subdomain name, code, or question text..."
			bind:value={filterText}
		/>
	</div>

	<div class="trace-list">
		{#each filteredSubdomains as [subId, trace]}
			<div class="trace-card" class:expanded={selectedSubdomain === subId}>
				<button class="trace-header" onclick={() => selectedSubdomain = selectedSubdomain === subId ? '' : subId}>
					<div class="trace-info">
						<span class="code">{trace.subdomain.code}</span>
						<span class="name">{trace.subdomain.shortName}</span>
						<span class="domain-tag">{trace.domain.name}</span>
					</div>
					<div class="trigger-count">
						{trace.triggeredBy.length} trigger{trace.triggeredBy.length !== 1 ? 's' : ''}
					</div>
				</button>

				{#if selectedSubdomain === subId}
					<div class="trace-body">
						<div class="section">
							<h4>Triggered By</h4>
							{#if trace.triggeredBy.length === 0}
								<p class="empty-note">No direct question triggers. May be triggered by model type selection.</p>
							{:else}
								{#each trace.triggeredBy as trigger}
									<div class="trigger-item">
										<span class="answer-badge">{trigger.answerValue}</span>
										<span class="question-text">{trigger.questionText}</span>
									</div>
								{/each}
							{/if}
						</div>

						<div class="section">
							<h4>
								Mitigation Text
								{#if !editableMitigations[subId]}
									<button class="edit-btn" onclick={() => startEditing(subId)}>Edit</button>
								{:else}
									<button class="save-btn" onclick={() => cancelEditing(subId)}>Done</button>
								{/if}
							</h4>

							{#if editableMitigations[subId]}
								<div class="phase-edit">
									<label>Phase 1</label>
									<textarea bind:value={editableMitigations[subId]['phase-1']} rows="3"></textarea>
								</div>
								<div class="phase-edit">
									<label>Phase 2</label>
									<textarea bind:value={editableMitigations[subId]['phase-2']} rows="3"></textarea>
								</div>
								<div class="phase-edit">
									<label>Phase 3</label>
									<textarea bind:value={editableMitigations[subId]['phase-3']} rows="3"></textarea>
								</div>
							{:else}
								<div class="phase-view">
									<div class="phase">
										<span class="phase-label">P1</span>
										<span class="phase-text">{trace.mitigations['phase-1']?.slice(0, 100)}...</span>
									</div>
									<div class="phase">
										<span class="phase-label">P2</span>
										<span class="phase-text">{trace.mitigations['phase-2']?.slice(0, 100)}...</span>
									</div>
									<div class="phase">
										<span class="phase-label">P3</span>
										<span class="phase-text">{trace.mitigations['phase-3']?.slice(0, 100)}...</span>
									</div>
								</div>
							{/if}
						</div>
					</div>
				{/if}
			</div>
		{/each}
	</div>

	<div class="help">
		<h3>How to edit triggers</h3>
		<p>Triggers are defined in <code>assessment-questions.json</code>. Each question can have a <code>triggers</code> object that maps answer values to subdomain IDs:</p>
		<pre>{`"triggers": {
  "yes": ["privacy-breach-2.1", "security-vulnerabilities-2.2"],
  "no": []
}`}</pre>
	</div>
</div>

<style>
	.admin {
		max-width: 1000px;
		margin: 0 auto;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1rem;
	}

	.header h1 {
		font-size: 1.25rem;
		color: #f1f5f9;
		margin-bottom: 0.25rem;
	}

	.header p {
		font-size: 0.75rem;
		color: #64748b;
	}

	.export-btn {
		padding: 0.5rem 1rem;
		background: #60a5fa;
		border: none;
		border-radius: 0.375rem;
		color: #0f172a;
		font-size: 0.75rem;
		font-weight: 600;
		cursor: pointer;
	}

	.export-btn:hover {
		background: #3b82f6;
	}

	.search {
		margin-bottom: 1rem;
	}

	.search input {
		width: 100%;
		padding: 0.625rem 0.875rem;
		background: #1e293b;
		border: 1px solid #334155;
		border-radius: 0.375rem;
		color: #e2e8f0;
		font-size: 0.8125rem;
	}

	.search input:focus {
		outline: none;
		border-color: #60a5fa;
	}

	.trace-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.trace-card {
		background: #1e293b;
		border: 1px solid #334155;
		border-radius: 0.375rem;
		overflow: hidden;
	}

	.trace-card.expanded {
		border-color: #60a5fa;
	}

	.trace-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		padding: 0.75rem 1rem;
		background: transparent;
		border: none;
		color: #e2e8f0;
		cursor: pointer;
		text-align: left;
	}

	.trace-header:hover {
		background: rgba(96, 165, 250, 0.05);
	}

	.trace-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.code {
		font-family: monospace;
		font-size: 0.6875rem;
		color: #60a5fa;
		background: rgba(96, 165, 250, 0.2);
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
	}

	.name {
		font-size: 0.8125rem;
		font-weight: 500;
	}

	.domain-tag {
		font-size: 0.625rem;
		color: #64748b;
		background: #0f172a;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
	}

	.trigger-count {
		font-size: 0.6875rem;
		color: #94a3b8;
	}

	.trace-body {
		padding: 0 1rem 1rem;
		border-top: 1px solid #334155;
	}

	.section {
		margin-top: 0.75rem;
	}

	.section h4 {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.6875rem;
		font-weight: 600;
		color: #64748b;
		text-transform: uppercase;
		margin-bottom: 0.5rem;
	}

	.edit-btn, .save-btn {
		padding: 0.125rem 0.375rem;
		background: #334155;
		border: none;
		border-radius: 0.125rem;
		color: #94a3b8;
		font-size: 0.5625rem;
		cursor: pointer;
		text-transform: none;
	}

	.edit-btn:hover {
		background: #60a5fa;
		color: #0f172a;
	}

	.save-btn {
		background: #22c55e;
		color: #0f172a;
	}

	.empty-note {
		font-size: 0.75rem;
		color: #64748b;
		font-style: italic;
	}

	.trigger-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.375rem 0;
		font-size: 0.75rem;
	}

	.answer-badge {
		font-size: 0.625rem;
		font-weight: 600;
		color: #22c55e;
		background: rgba(34, 197, 94, 0.2);
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
	}

	.question-text {
		color: #94a3b8;
	}

	.phase-view {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.phase {
		display: flex;
		gap: 0.5rem;
		font-size: 0.6875rem;
	}

	.phase-label {
		font-weight: 600;
		color: #60a5fa;
		min-width: 1.5rem;
	}

	.phase-text {
		color: #94a3b8;
	}

	.phase-edit {
		margin-bottom: 0.625rem;
	}

	.phase-edit label {
		display: block;
		font-size: 0.625rem;
		font-weight: 600;
		color: #60a5fa;
		margin-bottom: 0.25rem;
	}

	.phase-edit textarea {
		width: 100%;
		padding: 0.5rem;
		background: #0f172a;
		border: 1px solid #334155;
		border-radius: 0.25rem;
		color: #e2e8f0;
		font-size: 0.6875rem;
		line-height: 1.4;
		resize: vertical;
	}

	.phase-edit textarea:focus {
		outline: none;
		border-color: #60a5fa;
	}

	.help {
		margin-top: 2rem;
		padding: 1rem;
		background: #1e293b;
		border: 1px solid #334155;
		border-radius: 0.375rem;
	}

	.help h3 {
		font-size: 0.75rem;
		color: #e2e8f0;
		margin-bottom: 0.5rem;
	}

	.help p {
		font-size: 0.6875rem;
		color: #94a3b8;
		margin-bottom: 0.5rem;
	}

	.help code {
		background: #0f172a;
		padding: 0.0625rem 0.25rem;
		border-radius: 0.125rem;
		color: #60a5fa;
	}

	.help pre {
		background: #0f172a;
		padding: 0.625rem;
		border-radius: 0.25rem;
		font-size: 0.625rem;
		color: #e2e8f0;
		overflow-x: auto;
	}
</style>
