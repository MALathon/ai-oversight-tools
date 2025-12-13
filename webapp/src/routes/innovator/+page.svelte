<script lang="ts">
	import { base } from '$app/paths';
	import { onMount } from 'svelte';

	interface RiskArea {
		id: string;
		title: string;
		description: string;
		guidance: Record<string, string>;
		triggers: string[];
	}

	let loading = $state(true);

	// Project setup
	let selectedPhase = $state('');
	let selectedModelTypes = $state<Set<string>>(new Set());
	let projectCharacteristics = $state<Set<string>>(new Set());

	// User responses
	let responses = $state<Record<string, { addressed: boolean; notes: string }>>({});
	let customNotes = $state<Record<string, string>>({});

	const phases = [
		{ id: 'phase-1', name: 'Phase 1: Discovery', desc: 'Developing algorithms using retrospective/existing data. No clinical decisions.' },
		{ id: 'phase-2', name: 'Phase 2: Validation', desc: 'Prospective testing in controlled settings. Clinicians see outputs but don\'t rely on them.' },
		{ id: 'phase-3', name: 'Phase 3: Deployment', desc: 'Live clinical use. AI outputs may influence real patient care decisions.' }
	];

	const modelTypes = [
		{ id: 'llm', label: 'Large Language Model (ChatGPT-like)' },
		{ id: 'computer-vision', label: 'Computer Vision / Image Analysis' },
		{ id: 'predictive', label: 'Predictive / Risk Scoring Model' },
		{ id: 'recommendation', label: 'Recommendation System' },
		{ id: 'generative', label: 'Generative AI (images, text, etc.)' }
	];

	const characteristics = [
		{ id: 'patient-data', label: 'Uses patient health records or PHI' },
		{ id: 'direct-care', label: 'Outputs inform clinical decisions' },
		{ id: 'autonomous', label: 'Can operate without human review' },
		{ id: 'continuous-learning', label: 'Updates/learns after deployment' },
		{ id: 'black-box', label: 'Decision process is not fully explainable' },
		{ id: 'external-api', label: 'Uses cloud services or external APIs' },
		{ id: 'vulnerable-pop', label: 'Involves vulnerable populations' }
	];

	// Risk areas with phase-specific guidance
	const riskAreas: RiskArea[] = [
		{
			id: 'privacy',
			title: 'Data Privacy & Security',
			description: 'Protecting patient information and preventing unauthorized access',
			triggers: ['patient-data', 'external-api'],
			guidance: {
				'phase-1': 'De-identify your training data to HIPAA Safe Harbor standards. Use access controls so only approved team members can access the data. If using cloud services, ensure your institution has approved the vendor and a BAA is in place.',
				'phase-2': 'Continue Phase 1 protections. Add monitoring for re-identification risks in your data pipeline. Document your data flow and where PHI might be exposed.',
				'phase-3': 'All previous protections carry over. Implement audit logging for data access. Provide opt-out mechanisms for participants. Have a breach response plan ready.'
			}
		},
		{
			id: 'bias',
			title: 'Bias & Fairness',
			description: 'Ensuring equitable performance across demographic groups',
			triggers: ['predictive', 'computer-vision', 'recommendation', 'vulnerable-pop'],
			guidance: {
				'phase-1': 'Audit your training data for demographic gaps. Check if certain groups (race, gender, age, socioeconomic) are underrepresented. Run initial bias tests before finalizing your model.',
				'phase-2': 'Test model performance across demographic subgroups. Establish fairness thresholds - how much performance difference is acceptable? Document any disparities found.',
				'phase-3': 'Set up ongoing monitoring for demographic performance gaps. Report fairness metrics quarterly. Have a plan for what to do if bias is detected post-deployment.'
			}
		},
		{
			id: 'accuracy',
			title: 'Accuracy & Reliability',
			description: 'Ensuring outputs are trustworthy and errors are minimized',
			triggers: ['llm', 'generative', 'direct-care', 'predictive'],
			guidance: {
				'phase-1': 'Validate outputs against trusted reference sources. Include confidence scores or uncertainty estimates in your model design.',
				'phase-2': 'Stress test with edge cases and out-of-distribution data. Have domain experts review a sample of outputs for correctness.',
				'phase-3': 'Add disclaimers to outputs. Create a mechanism for users to flag errors. Have rollback procedures if accuracy drops.'
			}
		},
		{
			id: 'content-safety',
			title: 'Content Safety',
			description: 'Preventing harmful, toxic, or misleading outputs',
			triggers: ['llm', 'generative'],
			guidance: {
				'phase-1': 'Screen training data for toxic or harmful content. Implement safety guardrails in your model design.',
				'phase-2': 'Test how the model responds to adversarial prompts. Have humans review flagged outputs before they reach participants.',
				'phase-3': 'Deploy content filters to catch harmful outputs before users see them. Log incidents and review them regularly. Have a process for updating filters.'
			}
		},
		{
			id: 'human-oversight',
			title: 'Human Oversight & Autonomy',
			description: 'Keeping humans appropriately in the loop',
			triggers: ['direct-care', 'autonomous'],
			guidance: {
				'phase-1': 'Design outputs to be suggestive, not directive. The AI should support human decision-making, not replace it.',
				'phase-2': 'Require human review before any AI recommendation is acted upon. Track how often clinicians override the AI.',
				'phase-3': 'Train end users on AI limitations. Monitor for signs of over-reliance (always following AI, not questioning outputs). Keep human override mechanisms prominent.'
			}
		},
		{
			id: 'transparency',
			title: 'Transparency & Explainability',
			description: 'Making AI decisions understandable',
			triggers: ['black-box', 'direct-care'],
			guidance: {
				'phase-1': 'Document your model architecture and design decisions. Where possible, add explainability features (feature importance, attention visualization).',
				'phase-2': 'Share model explanations with clinicians/users and get feedback. Are the explanations actually helpful?',
				'phase-3': 'Inform participants when AI is being used. Provide lay-language explanations of how it works. Make technical documentation available for auditors.'
			}
		},
		{
			id: 'governance',
			title: 'Governance & Accountability',
			description: 'Having clear oversight and response procedures',
			triggers: [],
			guidance: {
				'phase-1': 'Identify what approvals you need before training (IRB, IT security, data governance). Document who is responsible for what.',
				'phase-2': 'Conduct a mock incident drill. What would you do if something goes wrong? Who needs to be notified?',
				'phase-3': 'Establish regular audits. Have a kill switch to halt the system if needed. Report to oversight bodies on a defined schedule.'
			}
		}
	];

	// Get applicable risk areas
	let applicableRisks = $derived.by(() => {
		if (!selectedPhase) return [];

		const allTriggers = new Set([...selectedModelTypes, ...projectCharacteristics]);

		return riskAreas.filter(risk => {
			// Governance applies to everyone
			if (risk.triggers.length === 0) return true;
			return risk.triggers.some(t => allTriggers.has(t));
		});
	});

	let showResults = $derived(selectedPhase !== '' && (selectedModelTypes.size > 0 || projectCharacteristics.size > 0));

	onMount(() => {
		loading = false;
	});

	function toggleModelType(id: string) {
		const newSet = new Set(selectedModelTypes);
		if (newSet.has(id)) newSet.delete(id);
		else newSet.add(id);
		selectedModelTypes = newSet;
	}

	function toggleCharacteristic(id: string) {
		const newSet = new Set(projectCharacteristics);
		if (newSet.has(id)) newSet.delete(id);
		else newSet.add(id);
		projectCharacteristics = newSet;
	}

	function toggleAddressed(riskId: string) {
		responses = {
			...responses,
			[riskId]: {
				addressed: !responses[riskId]?.addressed,
				notes: responses[riskId]?.notes || ''
			}
		};
	}

	function setNotes(riskId: string, notes: string) {
		responses = {
			...responses,
			[riskId]: {
				addressed: responses[riskId]?.addressed || false,
				notes
			}
		};
	}

	function getPhaseName(): string {
		return phases.find(p => p.id === selectedPhase)?.name.split(':')[1]?.trim() || '';
	}
</script>

<svelte:head>
	<title>AI Project Self-Assessment - AI Oversight Tools</title>
</svelte:head>

{#if loading}
	<div class="loading">Loading...</div>
{:else}
	<div class="self-assessment">
		<div class="intro">
			<h1>AI Project Self-Assessment</h1>
			<p>Answer a few questions about your AI project to see what risks to consider and how to address them at your current development phase.</p>
		</div>

		<!-- Step 1: Phase Selection -->
		<div class="section">
			<h2><span class="step-num">1</span> What phase is your project in?</h2>
			<div class="phase-cards">
				{#each phases as phase}
					<button
						class="phase-card"
						class:selected={selectedPhase === phase.id}
						onclick={() => selectedPhase = phase.id}
					>
						<strong>{phase.name}</strong>
						<p>{phase.desc}</p>
					</button>
				{/each}
			</div>
		</div>

		<!-- Step 2: Model Type -->
		<div class="section">
			<h2><span class="step-num">2</span> What type of AI are you building?</h2>
			<p class="section-hint">Select all that apply</p>
			<div class="option-grid">
				{#each modelTypes as mt}
					<button
						class="option-btn"
						class:selected={selectedModelTypes.has(mt.id)}
						onclick={() => toggleModelType(mt.id)}
					>
						{mt.label}
					</button>
				{/each}
			</div>
		</div>

		<!-- Step 3: Characteristics -->
		<div class="section">
			<h2><span class="step-num">3</span> Which of these apply to your project?</h2>
			<p class="section-hint">Select all that apply</p>
			<div class="option-grid">
				{#each characteristics as char}
					<button
						class="option-btn"
						class:selected={projectCharacteristics.has(char.id)}
						onclick={() => toggleCharacteristic(char.id)}
					>
						{char.label}
					</button>
				{/each}
			</div>
		</div>

		<!-- Results -->
		{#if showResults}
			<div class="results-section">
				<div class="results-header">
					<h2>Risk Areas to Address in {getPhaseName()}</h2>
					<p>Based on your selections, here are the key areas to consider. Use the checkboxes to track your progress and add notes about your approach.</p>
				</div>

				{#each applicableRisks as risk}
					<div class="risk-card" class:addressed={responses[risk.id]?.addressed}>
						<div class="risk-header">
							<label class="risk-checkbox">
								<input
									type="checkbox"
									checked={responses[risk.id]?.addressed || false}
									onchange={() => toggleAddressed(risk.id)}
								/>
								<span class="checkmark"></span>
							</label>
							<div class="risk-title">
								<h3>{risk.title}</h3>
								<p>{risk.description}</p>
							</div>
						</div>

						<div class="risk-guidance">
							<h4>What to do in {getPhaseName()}:</h4>
							<p>{risk.guidance[selectedPhase]}</p>
						</div>

						<div class="risk-notes">
							<label for="notes-{risk.id}">Your approach / notes:</label>
							<textarea
								id="notes-{risk.id}"
								placeholder="How will you address this? What have you already done?"
								value={responses[risk.id]?.notes || ''}
								oninput={(e) => setNotes(risk.id, e.currentTarget.value)}
							></textarea>
						</div>
					</div>
				{/each}

				<div class="next-steps">
					<h3>Next Steps</h3>
					<ul>
						<li>Review the <a href="{base}/reviewer/">IRB Reviewer Checklist</a> to see what reviewers will look for</li>
						<li>Use the <a href="{base}/risk-matrix/">Risk Matrix</a> to understand severity and likelihood</li>
						<li>Document your risk mitigation approach in your IRB protocol</li>
					</ul>
				</div>
			</div>
		{/if}
	</div>
{/if}

<style>
	.loading {
		text-align: center;
		color: #94a3b8;
		padding: 3rem;
	}

	.self-assessment {
		max-width: 900px;
		margin: 0 auto;
	}

	.intro {
		margin-bottom: 2rem;
	}

	.intro h1 {
		font-size: 1.75rem;
		color: #f1f5f9;
		margin-bottom: 0.5rem;
	}

	.intro p {
		color: #94a3b8;
		font-size: 1rem;
	}

	.section {
		background: #1e293b;
		border: 1px solid #334155;
		border-radius: 0.75rem;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.section h2 {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-size: 1.125rem;
		color: #f1f5f9;
		margin-bottom: 1rem;
	}

	.step-num {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		background: #60a5fa;
		color: #0f172a;
		font-size: 0.875rem;
		font-weight: 700;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.section-hint {
		color: #64748b;
		font-size: 0.875rem;
		margin-bottom: 1rem;
	}

	.phase-cards {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.phase-card {
		text-align: left;
		padding: 1rem 1.25rem;
		background: #0f172a;
		border: 2px solid #334155;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.phase-card strong {
		display: block;
		font-size: 1rem;
		color: #e2e8f0;
		margin-bottom: 0.25rem;
	}

	.phase-card p {
		font-size: 0.8125rem;
		color: #64748b;
		margin: 0;
	}

	.phase-card:hover {
		border-color: #60a5fa;
	}

	.phase-card.selected {
		border-color: #60a5fa;
		background: rgba(96, 165, 250, 0.1);
	}

	.phase-card.selected strong {
		color: #60a5fa;
	}

	.option-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 0.5rem;
	}

	.option-btn {
		text-align: left;
		padding: 0.75rem 1rem;
		background: #0f172a;
		border: 2px solid #334155;
		border-radius: 0.5rem;
		color: #94a3b8;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.option-btn:hover {
		border-color: #60a5fa;
		color: #e2e8f0;
	}

	.option-btn.selected {
		border-color: #60a5fa;
		background: rgba(96, 165, 250, 0.1);
		color: #f1f5f9;
	}

	.results-section {
		margin-top: 2rem;
	}

	.results-header {
		margin-bottom: 1.5rem;
	}

	.results-header h2 {
		font-size: 1.25rem;
		color: #60a5fa;
		margin-bottom: 0.5rem;
	}

	.results-header p {
		color: #94a3b8;
		font-size: 0.9375rem;
	}

	.risk-card {
		background: #1e293b;
		border: 1px solid #334155;
		border-radius: 0.75rem;
		padding: 1.25rem;
		margin-bottom: 1rem;
		transition: all 0.15s ease;
	}

	.risk-card.addressed {
		border-color: #22c55e;
		background: rgba(34, 197, 94, 0.05);
	}

	.risk-header {
		display: flex;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.risk-checkbox {
		position: relative;
		cursor: pointer;
		flex-shrink: 0;
	}

	.risk-checkbox input {
		position: absolute;
		opacity: 0;
		cursor: pointer;
	}

	.checkmark {
		display: block;
		width: 24px;
		height: 24px;
		background: #0f172a;
		border: 2px solid #475569;
		border-radius: 0.375rem;
		transition: all 0.15s ease;
	}

	.risk-checkbox input:checked ~ .checkmark {
		background: #22c55e;
		border-color: #22c55e;
	}

	.risk-checkbox input:checked ~ .checkmark::after {
		content: '✓';
		display: flex;
		align-items: center;
		justify-content: center;
		color: #0f172a;
		font-weight: bold;
		font-size: 0.875rem;
	}

	.risk-title h3 {
		font-size: 1rem;
		color: #f1f5f9;
		margin-bottom: 0.25rem;
	}

	.risk-title p {
		font-size: 0.8125rem;
		color: #64748b;
		margin: 0;
	}

	.risk-guidance {
		background: #0f172a;
		border-radius: 0.5rem;
		padding: 1rem;
		margin-bottom: 1rem;
	}

	.risk-guidance h4 {
		font-size: 0.75rem;
		font-weight: 600;
		color: #60a5fa;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.5rem;
	}

	.risk-guidance p {
		font-size: 0.875rem;
		color: #cbd5e1;
		line-height: 1.6;
		margin: 0;
	}

	.risk-notes label {
		display: block;
		font-size: 0.75rem;
		font-weight: 600;
		color: #64748b;
		margin-bottom: 0.5rem;
	}

	.risk-notes textarea {
		width: 100%;
		min-height: 80px;
		padding: 0.75rem;
		background: #0f172a;
		border: 1px solid #334155;
		border-radius: 0.5rem;
		color: #e2e8f0;
		font-size: 0.875rem;
		font-family: inherit;
		resize: vertical;
	}

	.risk-notes textarea:focus {
		outline: none;
		border-color: #60a5fa;
	}

	.risk-notes textarea::placeholder {
		color: #475569;
	}

	.next-steps {
		background: linear-gradient(135deg, rgba(96, 165, 250, 0.1), rgba(34, 197, 94, 0.05));
		border: 1px solid #334155;
		border-radius: 0.75rem;
		padding: 1.25rem;
		margin-top: 2rem;
	}

	.next-steps h3 {
		font-size: 1rem;
		color: #f1f5f9;
		margin-bottom: 0.75rem;
	}

	.next-steps ul {
		margin: 0;
		padding-left: 1.25rem;
	}

	.next-steps li {
		color: #94a3b8;
		font-size: 0.875rem;
		margin-bottom: 0.5rem;
	}

	.next-steps a {
		color: #60a5fa;
		text-decoration: none;
	}

	.next-steps a:hover {
		text-decoration: underline;
	}
</style>
