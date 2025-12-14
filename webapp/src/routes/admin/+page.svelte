<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Make copies of data for editing
	let questions = $state(structuredClone(data.questions));
	let phaseMitigations = $state(structuredClone(data.phaseMitigations));

	let activeTab = $state<'questions' | 'mitigations'>('questions');
	let selectedCategory = $state(0);
	let selectedQuestion = $state(0);
	let selectedSubdomain = $state('');

	// Get all subdomains for dropdown
	let allSubdomains = $derived(data.subdomains.map((s: any) => ({
		id: s.id,
		code: s.code,
		name: s.shortName
	})));

	// Current question being edited
	let currentQuestion = $derived(
		questions.questionCategories[selectedCategory]?.questions[selectedQuestion]
	);

	// Add a new trigger to current question
	function addTrigger(value: string) {
		if (!currentQuestion.triggers) {
			currentQuestion.triggers = {};
		}
		if (!currentQuestion.triggers[value]) {
			currentQuestion.triggers[value] = [];
		}
	}

	// Add subdomain to a trigger
	function addSubdomainToTrigger(triggerKey: string, subdomainId: string) {
		if (!currentQuestion.triggers[triggerKey].includes(subdomainId)) {
			currentQuestion.triggers[triggerKey] = [...currentQuestion.triggers[triggerKey], subdomainId];
		}
	}

	// Remove subdomain from trigger
	function removeSubdomainFromTrigger(triggerKey: string, subdomainId: string) {
		currentQuestion.triggers[triggerKey] = currentQuestion.triggers[triggerKey].filter(
			(s: string) => s !== subdomainId
		);
	}

	// Export questions JSON
	function exportQuestions() {
		const blob = new Blob([JSON.stringify(questions, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'assessment-questions.json';
		a.click();
		URL.revokeObjectURL(url);
	}

	// Export mitigations JSON
	function exportMitigations() {
		const blob = new Blob([JSON.stringify(phaseMitigations, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'phase-mitigations.json';
		a.click();
		URL.revokeObjectURL(url);
	}

	// Reset to original data
	function resetQuestions() {
		questions = structuredClone(data.questions);
	}

	function resetMitigations() {
		phaseMitigations = structuredClone(data.phaseMitigations);
	}
</script>

<svelte:head>
	<title>Admin Panel - AI Oversight Tools</title>
</svelte:head>

<div class="admin">
	<div class="admin-header">
		<h1>Admin Panel</h1>
		<p>Edit assessment questions, triggers, and mitigation text. Export updated JSON to commit to the repository.</p>
	</div>

	<div class="tabs">
		<button
			class="tab"
			class:active={activeTab === 'questions'}
			onclick={() => activeTab = 'questions'}
		>
			Questions & Triggers
		</button>
		<button
			class="tab"
			class:active={activeTab === 'mitigations'}
			onclick={() => activeTab = 'mitigations'}
		>
			Phase Mitigations
		</button>
	</div>

	{#if activeTab === 'questions'}
		<div class="panel">
			<div class="panel-header">
				<h2>Assessment Questions</h2>
				<div class="actions">
					<button class="btn secondary" onclick={resetQuestions}>Reset</button>
					<button class="btn primary" onclick={exportQuestions}>Export JSON</button>
				</div>
			</div>

			<div class="editor-layout">
				<!-- Category/Question Selector -->
				<div class="sidebar">
					<h3>Categories</h3>
					{#each questions.questionCategories as category, catIdx}
						<div class="category-group">
							<button
								class="category-btn"
								class:active={selectedCategory === catIdx}
								onclick={() => { selectedCategory = catIdx; selectedQuestion = 0; }}
							>
								{category.name}
							</button>
							{#if selectedCategory === catIdx}
								<div class="question-list">
									{#each category.questions as q, qIdx}
										<button
											class="question-btn"
											class:active={selectedQuestion === qIdx}
											onclick={() => selectedQuestion = qIdx}
										>
											{q.id}
										</button>
									{/each}
								</div>
							{/if}
						</div>
					{/each}
				</div>

				<!-- Question Editor -->
				<div class="editor">
					{#if currentQuestion}
						<div class="field">
							<label>Question ID</label>
							<input type="text" bind:value={currentQuestion.id} disabled />
						</div>

						<div class="field">
							<label>Question Text</label>
							<textarea bind:value={currentQuestion.question} rows="2"></textarea>
						</div>

						<div class="field">
							<label>Type</label>
							<select bind:value={currentQuestion.type}>
								<option value="single-select">Single Select</option>
								<option value="multi-select">Multi Select</option>
								<option value="yes-no">Yes/No</option>
							</select>
						</div>

						{#if currentQuestion.type !== 'yes-no' && currentQuestion.options}
							<div class="field">
								<label>Options</label>
								{#each currentQuestion.options as option, optIdx}
									<div class="option-row">
										<input type="text" bind:value={option.value} placeholder="Value" />
										<input type="text" bind:value={option.label} placeholder="Label" />
										<input type="text" bind:value={option.description} placeholder="Description" />
									</div>
								{/each}
							</div>
						{/if}

						<div class="field">
							<label>Triggers (answer value → subdomains)</label>
							<div class="triggers-editor">
								{#if currentQuestion.triggers}
									{#each Object.entries(currentQuestion.triggers) as [key, subdomains]}
										{#if key !== '_note'}
											<div class="trigger-group">
												<div class="trigger-key">{key}</div>
												<div class="trigger-subdomains">
													{#each subdomains as subdomainId}
														<span class="subdomain-tag">
															{subdomainId}
															<button onclick={() => removeSubdomainFromTrigger(key, subdomainId)}>×</button>
														</span>
													{/each}
													<select onchange={(e) => {
														const target = e.target as HTMLSelectElement;
														if (target.value) {
															addSubdomainToTrigger(key, target.value);
															target.value = '';
														}
													}}>
														<option value="">+ Add subdomain</option>
														{#each allSubdomains as sd}
															<option value={sd.id}>{sd.code} - {sd.name}</option>
														{/each}
													</select>
												</div>
											</div>
										{/if}
									{/each}
								{/if}
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>
	{:else}
		<div class="panel">
			<div class="panel-header">
				<h2>Phase Mitigations</h2>
				<div class="actions">
					<button class="btn secondary" onclick={resetMitigations}>Reset</button>
					<button class="btn primary" onclick={exportMitigations}>Export JSON</button>
				</div>
			</div>

			<div class="editor-layout">
				<!-- Subdomain Selector -->
				<div class="sidebar">
					<h3>Risk Subdomains</h3>
					{#each data.domains as domain}
						<div class="domain-group">
							<div class="domain-name">{domain.name}</div>
							{#each domain.subdomains as subdomainId}
								{@const subdomain = data.subdomains.find((s: any) => s.id === subdomainId)}
								{#if subdomain}
									<button
										class="subdomain-btn"
										class:active={selectedSubdomain === subdomainId}
										onclick={() => selectedSubdomain = subdomainId}
									>
										<span class="code">{subdomain.code}</span>
										{subdomain.shortName}
									</button>
								{/if}
							{/each}
						</div>
					{/each}
				</div>

				<!-- Mitigation Editor -->
				<div class="editor">
					{#if selectedSubdomain && phaseMitigations.phaseMitigations[selectedSubdomain]}
						{@const subdomain = data.subdomains.find((s: any) => s.id === selectedSubdomain)}
						<h3>{subdomain?.name || selectedSubdomain}</h3>
						<p class="subdomain-desc">{subdomain?.description}</p>

						<div class="phase-editors">
							<div class="phase-editor">
								<label>Phase 1: Discovery</label>
								<textarea
									bind:value={phaseMitigations.phaseMitigations[selectedSubdomain]['phase-1']}
									rows="6"
								></textarea>
							</div>

							<div class="phase-editor">
								<label>Phase 2: Validation</label>
								<textarea
									bind:value={phaseMitigations.phaseMitigations[selectedSubdomain]['phase-2']}
									rows="6"
								></textarea>
							</div>

							<div class="phase-editor">
								<label>Phase 3: Deployment</label>
								<textarea
									bind:value={phaseMitigations.phaseMitigations[selectedSubdomain]['phase-3']}
									rows="6"
								></textarea>
							</div>
						</div>
					{:else}
						<div class="empty-editor">
							<p>Select a subdomain to edit its phase mitigations</p>
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.admin {
		max-width: 1400px;
		margin: 0 auto;
	}

	.admin-header {
		margin-bottom: 1.5rem;
	}

	.admin-header h1 {
		font-size: 1.5rem;
		color: #f1f5f9;
		margin-bottom: 0.5rem;
	}

	.admin-header p {
		color: #64748b;
		font-size: 0.875rem;
	}

	.tabs {
		display: flex;
		gap: 0.25rem;
		margin-bottom: 1rem;
	}

	.tab {
		padding: 0.75rem 1.5rem;
		background: #1e293b;
		border: 1px solid #334155;
		border-bottom: none;
		border-radius: 0.5rem 0.5rem 0 0;
		color: #94a3b8;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.1s ease;
	}

	.tab:hover {
		color: #e2e8f0;
	}

	.tab.active {
		background: #334155;
		color: #60a5fa;
	}

	.panel {
		background: #1e293b;
		border: 1px solid #334155;
		border-radius: 0 0.5rem 0.5rem 0.5rem;
		padding: 1.5rem;
	}

	.panel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid #334155;
	}

	.panel-header h2 {
		font-size: 1.125rem;
		color: #f1f5f9;
	}

	.actions {
		display: flex;
		gap: 0.5rem;
	}

	.btn {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 0.375rem;
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.1s ease;
	}

	.btn.primary {
		background: #60a5fa;
		color: #0f172a;
	}

	.btn.primary:hover {
		background: #3b82f6;
	}

	.btn.secondary {
		background: #334155;
		color: #94a3b8;
	}

	.btn.secondary:hover {
		background: #475569;
		color: #e2e8f0;
	}

	.editor-layout {
		display: grid;
		grid-template-columns: 280px 1fr;
		gap: 1.5rem;
	}

	.sidebar {
		border-right: 1px solid #334155;
		padding-right: 1rem;
		max-height: 600px;
		overflow-y: auto;
	}

	.sidebar h3 {
		font-size: 0.75rem;
		font-weight: 600;
		color: #64748b;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.75rem;
	}

	.category-group {
		margin-bottom: 0.5rem;
	}

	.category-btn, .question-btn, .subdomain-btn {
		display: block;
		width: 100%;
		text-align: left;
		padding: 0.5rem 0.75rem;
		background: transparent;
		border: none;
		border-radius: 0.375rem;
		color: #94a3b8;
		font-size: 0.8125rem;
		cursor: pointer;
		transition: all 0.1s ease;
	}

	.category-btn:hover, .question-btn:hover, .subdomain-btn:hover {
		background: #334155;
		color: #e2e8f0;
	}

	.category-btn.active, .question-btn.active, .subdomain-btn.active {
		background: rgba(96, 165, 250, 0.2);
		color: #60a5fa;
	}

	.question-list {
		padding-left: 1rem;
		margin-top: 0.25rem;
	}

	.question-btn {
		font-size: 0.75rem;
		padding: 0.375rem 0.5rem;
	}

	.domain-group {
		margin-bottom: 1rem;
	}

	.domain-name {
		font-size: 0.6875rem;
		font-weight: 600;
		color: #60a5fa;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 0.25rem 0.5rem;
		margin-bottom: 0.25rem;
	}

	.subdomain-btn {
		padding: 0.375rem 0.5rem;
		font-size: 0.75rem;
	}

	.subdomain-btn .code {
		font-family: monospace;
		color: #60a5fa;
		margin-right: 0.375rem;
	}

	.editor {
		min-height: 400px;
	}

	.editor h3 {
		font-size: 1rem;
		color: #f1f5f9;
		margin-bottom: 0.5rem;
	}

	.subdomain-desc {
		font-size: 0.8125rem;
		color: #64748b;
		margin-bottom: 1.5rem;
	}

	.field {
		margin-bottom: 1rem;
	}

	.field label {
		display: block;
		font-size: 0.75rem;
		font-weight: 500;
		color: #94a3b8;
		margin-bottom: 0.375rem;
	}

	.field input, .field select, .field textarea {
		width: 100%;
		padding: 0.5rem 0.75rem;
		background: #0f172a;
		border: 1px solid #334155;
		border-radius: 0.375rem;
		color: #e2e8f0;
		font-size: 0.8125rem;
	}

	.field input:focus, .field select:focus, .field textarea:focus {
		outline: none;
		border-color: #60a5fa;
	}

	.field input:disabled {
		background: #1e293b;
		color: #64748b;
	}

	.field textarea {
		resize: vertical;
		min-height: 60px;
		line-height: 1.5;
	}

	.option-row {
		display: grid;
		grid-template-columns: 120px 1fr 1fr;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.triggers-editor {
		background: #0f172a;
		border: 1px solid #334155;
		border-radius: 0.375rem;
		padding: 0.75rem;
	}

	.trigger-group {
		margin-bottom: 0.75rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid #334155;
	}

	.trigger-group:last-child {
		margin-bottom: 0;
		padding-bottom: 0;
		border-bottom: none;
	}

	.trigger-key {
		font-family: monospace;
		font-size: 0.75rem;
		color: #60a5fa;
		margin-bottom: 0.5rem;
	}

	.trigger-subdomains {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
		align-items: center;
	}

	.subdomain-tag {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.5rem;
		background: #334155;
		border-radius: 0.25rem;
		font-size: 0.6875rem;
		color: #e2e8f0;
	}

	.subdomain-tag button {
		background: none;
		border: none;
		color: #94a3b8;
		cursor: pointer;
		padding: 0;
		font-size: 0.875rem;
		line-height: 1;
	}

	.subdomain-tag button:hover {
		color: #ef4444;
	}

	.trigger-subdomains select {
		padding: 0.25rem 0.5rem;
		font-size: 0.6875rem;
	}

	.phase-editors {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.phase-editor label {
		display: block;
		font-size: 0.75rem;
		font-weight: 600;
		color: #60a5fa;
		margin-bottom: 0.5rem;
	}

	.phase-editor textarea {
		width: 100%;
		padding: 0.75rem;
		background: #0f172a;
		border: 1px solid #334155;
		border-radius: 0.375rem;
		color: #e2e8f0;
		font-size: 0.8125rem;
		line-height: 1.6;
		resize: vertical;
	}

	.phase-editor textarea:focus {
		outline: none;
		border-color: #60a5fa;
	}

	.empty-editor {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		min-height: 300px;
		color: #64748b;
	}

	@media (max-width: 900px) {
		.editor-layout {
			grid-template-columns: 1fr;
		}

		.sidebar {
			border-right: none;
			border-bottom: 1px solid #334155;
			padding-right: 0;
			padding-bottom: 1rem;
			max-height: none;
		}
	}
</style>
