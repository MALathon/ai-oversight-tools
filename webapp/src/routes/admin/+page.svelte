<script lang="ts">
	import { base } from '$app/paths';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Editable data
	let questions = $state(JSON.parse(JSON.stringify(data.questions)));
	let mitigations = $state(JSON.parse(JSON.stringify(data.phaseMitigations)));

	// UI State
	let selectedNode = $state<{type: 'question' | 'subdomain', id: string} | null>(null);
	let connecting = $state<{questionId: string, answerValue: string} | null>(null);
	let canvas: HTMLDivElement;

	// Build flat list of question-answer pairs for left side
	let questionAnswers = $derived.by(() => {
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
						if (opt.value === 'none' || opt.value === 'yes' && q.type !== 'yes-no') continue;
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

	// Build subdomain list for right side
	let subdomains = $derived(
		data.domains.flatMap((d: any) =>
			d.subdomains.map((subId: string) => {
				const sub = data.subdomains.find((s: any) => s.id === subId);
				return sub ? { ...sub, domainName: d.name } : null;
			}).filter(Boolean)
		)
	);

	// Get all connections (triggers)
	let connections = $derived.by(() => {
		const conns: Array<{
			questionId: string;
			answerValue: string;
			subdomainId: string;
		}> = [];

		for (const cat of questions.questionCategories) {
			for (const q of cat.questions) {
				if (!q.triggers) continue;
				for (const [answerValue, subIds] of Object.entries(q.triggers)) {
					if (answerValue === '_note') continue;
					for (const subId of subIds as string[]) {
						conns.push({
							questionId: q.id,
							answerValue,
							subdomainId: subId
						});
					}
				}
			}
		}
		return conns;
	});

	// Add a connection
	function addConnection(questionId: string, answerValue: string, subdomainId: string) {
		for (const cat of questions.questionCategories) {
			for (const q of cat.questions) {
				if (q.id === questionId) {
					if (!q.triggers) q.triggers = {};
					if (!q.triggers[answerValue]) q.triggers[answerValue] = [];
					if (!q.triggers[answerValue].includes(subdomainId)) {
						q.triggers[answerValue] = [...q.triggers[answerValue], subdomainId];
					}
					return;
				}
			}
		}
	}

	// Remove a connection
	function removeConnection(questionId: string, answerValue: string, subdomainId: string) {
		for (const cat of questions.questionCategories) {
			for (const q of cat.questions) {
				if (q.id === questionId && q.triggers && q.triggers[answerValue]) {
					q.triggers[answerValue] = q.triggers[answerValue].filter((id: string) => id !== subdomainId);
					return;
				}
			}
		}
	}

	// Handle clicking on a subdomain while connecting
	function handleSubdomainClick(subdomainId: string) {
		if (connecting) {
			addConnection(connecting.questionId, connecting.answerValue, subdomainId);
			connecting = null;
		} else {
			selectedNode = { type: 'subdomain', id: subdomainId };
		}
	}

	// Start connecting from an answer
	function startConnection(questionId: string, answerValue: string) {
		connecting = { questionId, answerValue };
	}

	// Export configuration
	function exportConfig() {
		// Build the phase-mitigations.json structure
		const phaseMitigationsOutput = {
			"$schema": "../schemas/phase-mitigations.schema.json",
			"version": "1.0.0",
			"source": "AIHSR Risk Reference Tool v1.5 (Tamiko Eto)",
			"lastUpdated": new Date().toISOString().split('T')[0],
			"description": "Phase-based mitigation strategy templates for each risk subdomain",
			"phaseMitigations": mitigations
		};

		// Download phase-mitigations.json
		const blob1 = new Blob([JSON.stringify(phaseMitigationsOutput, null, 2)], { type: 'application/json' });
		const url1 = URL.createObjectURL(blob1);
		const a1 = document.createElement('a');
		a1.href = url1;
		a1.download = 'phase-mitigations.json';
		a1.click();
		URL.revokeObjectURL(url1);

		// Download assessment-questions.json
		setTimeout(() => {
			const blob2 = new Blob([JSON.stringify(questions, null, 2)], { type: 'application/json' });
			const url2 = URL.createObjectURL(blob2);
			const a2 = document.createElement('a');
			a2.href = url2;
			a2.download = 'assessment-questions.json';
			a2.click();
			URL.revokeObjectURL(url2);
		}, 500);
	}

	// Get selected subdomain data
	let selectedSubdomain = $derived(
		selectedNode?.type === 'subdomain'
			? subdomains.find((s: any) => s.id === selectedNode.id)
			: null
	);
</script>

<svelte:head>
	<title>Visual Editor - AI Oversight Tools</title>
</svelte:head>

<div class="editor">
	<div class="toolbar">
		<h1>Risk Trigger Editor</h1>
		<div class="toolbar-actions">
			{#if connecting}
				<span class="connecting-hint">Click a risk subdomain to connect, or</span>
				<button class="btn" onclick={() => connecting = null}>Cancel</button>
			{/if}
			<button class="btn primary" onclick={exportConfig}>Export Config</button>
		</div>
	</div>

	<div class="canvas" bind:this={canvas}>
		<!-- Left: Question/Answers -->
		<div class="column questions-col">
			<h2>Questions & Answers</h2>
			<p class="hint">Click an answer to start connecting to a risk</p>

			{#each questionAnswers as qa}
				<button
					class="node question-node"
					class:connecting={connecting?.questionId === qa.questionId && connecting?.answerValue === qa.answerValue}
					onclick={() => startConnection(qa.questionId, qa.answerValue)}
				>
					<span class="answer-badge">{qa.answerLabel}</span>
					<span class="question-text">{qa.questionText}</span>
					<span class="connection-count">
						{connections.filter(c => c.questionId === qa.questionId && c.answerValue === qa.answerValue).length}
					</span>
				</button>
			{/each}
		</div>

		<!-- Center: Connections visualization -->
		<div class="column connections-col">
			<h2>Active Triggers</h2>
			<p class="hint">Click to remove a connection</p>

			{#each connections as conn}
				{@const qa = questionAnswers.find(q => q.questionId === conn.questionId && q.answerValue === conn.answerValue)}
				{@const sub = subdomains.find((s: any) => s.id === conn.subdomainId)}
				{#if qa && sub}
					<button
						class="connection-card"
						onclick={() => removeConnection(conn.questionId, conn.answerValue, conn.subdomainId)}
					>
						<div class="conn-from">
							<span class="answer-badge small">{qa.answerLabel}</span>
							<span class="q-preview">{qa.questionText.slice(0, 30)}...</span>
						</div>
						<div class="conn-arrow">→</div>
						<div class="conn-to">
							<span class="code">{sub.code}</span>
							<span class="sub-name">{sub.shortName}</span>
						</div>
					</button>
				{/if}
			{/each}

			{#if connections.length === 0}
				<div class="empty">No triggers defined yet</div>
			{/if}
		</div>

		<!-- Right: Risk Subdomains -->
		<div class="column subdomains-col">
			<h2>Risk Subdomains</h2>
			<p class="hint">{connecting ? 'Click to connect' : 'Click to edit mitigations'}</p>

			{#each subdomains as sub}
				<button
					class="node subdomain-node"
					class:target={connecting !== null}
					class:selected={selectedNode?.type === 'subdomain' && selectedNode?.id === sub.id}
					onclick={() => handleSubdomainClick(sub.id)}
				>
					<span class="code">{sub.code}</span>
					<span class="sub-name">{sub.shortName}</span>
					<span class="domain-tag">{sub.domainName}</span>
					<span class="connection-count">
						{connections.filter(c => c.subdomainId === sub.id).length}
					</span>
				</button>
			{/each}
		</div>
	</div>

	<!-- Bottom: Edit Panel -->
	{#if selectedSubdomain && mitigations[selectedSubdomain.id]}
		<div class="edit-panel">
			<div class="edit-header">
				<h3>{selectedSubdomain.code}: {selectedSubdomain.name}</h3>
				<button class="close-btn" onclick={() => selectedNode = null}>×</button>
			</div>
			<p class="edit-desc">{selectedSubdomain.description}</p>

			<div class="phase-editors">
				<div class="phase-editor">
					<label>Phase 1: Discovery</label>
					<textarea bind:value={mitigations[selectedSubdomain.id]['phase-1']} rows="4"></textarea>
				</div>
				<div class="phase-editor">
					<label>Phase 2: Validation</label>
					<textarea bind:value={mitigations[selectedSubdomain.id]['phase-2']} rows="4"></textarea>
				</div>
				<div class="phase-editor">
					<label>Phase 3: Deployment</label>
					<textarea bind:value={mitigations[selectedSubdomain.id]['phase-3']} rows="4"></textarea>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.editor {
		display: flex;
		flex-direction: column;
		height: calc(100vh - 120px);
		gap: 0;
	}

	.toolbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 0;
		border-bottom: 1px solid #334155;
		flex-shrink: 0;
	}

	.toolbar h1 {
		font-size: 1.125rem;
		color: #f1f5f9;
	}

	.toolbar-actions {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.connecting-hint {
		font-size: 0.75rem;
		color: #fbbf24;
	}

	.btn {
		padding: 0.375rem 0.75rem;
		background: #334155;
		border: none;
		border-radius: 0.25rem;
		color: #e2e8f0;
		font-size: 0.75rem;
		cursor: pointer;
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

	.canvas {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		gap: 1rem;
		flex: 1;
		overflow: hidden;
		padding: 1rem 0;
	}

	.column {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		overflow-y: auto;
		padding: 0.5rem;
		background: #1e293b;
		border-radius: 0.5rem;
	}

	.column h2 {
		font-size: 0.75rem;
		font-weight: 600;
		color: #60a5fa;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.25rem;
		position: sticky;
		top: 0;
		background: #1e293b;
		padding: 0.25rem 0;
	}

	.column .hint {
		font-size: 0.625rem;
		color: #64748b;
		margin-bottom: 0.5rem;
	}

	.node {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem;
		background: #0f172a;
		border: 1px solid #334155;
		border-radius: 0.375rem;
		text-align: left;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.node:hover {
		border-color: #60a5fa;
	}

	.question-node {
		flex-wrap: wrap;
	}

	.question-node.connecting {
		border-color: #fbbf24;
		background: rgba(251, 191, 36, 0.1);
	}

	.question-node .answer-badge {
		font-size: 0.5625rem;
		font-weight: 600;
		color: #22c55e;
		background: rgba(34, 197, 94, 0.2);
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
	}

	.question-node .question-text {
		flex: 1;
		font-size: 0.625rem;
		color: #94a3b8;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.connection-count {
		font-size: 0.5625rem;
		color: #64748b;
		background: #334155;
		padding: 0.0625rem 0.25rem;
		border-radius: 0.125rem;
		min-width: 1rem;
		text-align: center;
	}

	.subdomain-node {
		flex-wrap: wrap;
	}

	.subdomain-node.target {
		border-color: #fbbf24;
		animation: pulse 1s infinite;
	}

	.subdomain-node.selected {
		border-color: #60a5fa;
		background: rgba(96, 165, 250, 0.1);
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.7; }
	}

	.subdomain-node .code {
		font-family: monospace;
		font-size: 0.5625rem;
		color: #60a5fa;
		background: rgba(96, 165, 250, 0.2);
		padding: 0.0625rem 0.25rem;
		border-radius: 0.125rem;
	}

	.subdomain-node .sub-name {
		flex: 1;
		font-size: 0.625rem;
		color: #e2e8f0;
	}

	.subdomain-node .domain-tag {
		font-size: 0.5rem;
		color: #64748b;
		background: #1e293b;
		padding: 0.0625rem 0.25rem;
		border-radius: 0.125rem;
	}

	.connections-col {
		background: #0f172a;
	}

	.connection-card {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem;
		background: #1e293b;
		border: 1px solid #334155;
		border-radius: 0.25rem;
		cursor: pointer;
		text-align: left;
	}

	.connection-card:hover {
		border-color: #ef4444;
		background: rgba(239, 68, 68, 0.1);
	}

	.conn-from, .conn-to {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.conn-from .answer-badge.small {
		font-size: 0.5rem;
		padding: 0.0625rem 0.25rem;
	}

	.conn-from .q-preview {
		font-size: 0.5625rem;
		color: #64748b;
	}

	.conn-arrow {
		color: #60a5fa;
		font-size: 0.875rem;
	}

	.conn-to .code {
		font-family: monospace;
		font-size: 0.5rem;
		color: #60a5fa;
	}

	.conn-to .sub-name {
		font-size: 0.5625rem;
		color: #94a3b8;
	}

	.empty {
		text-align: center;
		padding: 2rem;
		color: #64748b;
		font-size: 0.75rem;
	}

	.edit-panel {
		background: #1e293b;
		border: 1px solid #334155;
		border-radius: 0.5rem;
		padding: 1rem;
		flex-shrink: 0;
		max-height: 280px;
		overflow-y: auto;
	}

	.edit-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.edit-header h3 {
		font-size: 0.875rem;
		color: #f1f5f9;
	}

	.close-btn {
		background: none;
		border: none;
		color: #64748b;
		font-size: 1.25rem;
		cursor: pointer;
		padding: 0;
		line-height: 1;
	}

	.close-btn:hover {
		color: #e2e8f0;
	}

	.edit-desc {
		font-size: 0.6875rem;
		color: #64748b;
		margin-bottom: 0.75rem;
	}

	.phase-editors {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.75rem;
	}

	.phase-editor label {
		display: block;
		font-size: 0.625rem;
		font-weight: 600;
		color: #60a5fa;
		margin-bottom: 0.25rem;
	}

	.phase-editor textarea {
		width: 100%;
		padding: 0.5rem;
		background: #0f172a;
		border: 1px solid #334155;
		border-radius: 0.25rem;
		color: #e2e8f0;
		font-size: 0.625rem;
		line-height: 1.4;
		resize: vertical;
	}

	.phase-editor textarea:focus {
		outline: none;
		border-color: #60a5fa;
	}

	@media (max-width: 1000px) {
		.canvas {
			grid-template-columns: 1fr;
		}

		.phase-editors {
			grid-template-columns: 1fr;
		}
	}
</style>
