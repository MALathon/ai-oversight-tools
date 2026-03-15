<script lang="ts">
	import type { Stage } from '../types';

	interface ModelType {
		id: string;
		name: string;
	}

	interface Props {
		stages: Stage[];
		modelTypes: ModelType[];
		selectedStage: string;
		selectedTechType: string;
		onStageChange: (stage: string) => void;
		onTechTypeChange: (techType: string) => void;
	}

	let {
		stages,
		modelTypes,
		selectedStage,
		selectedTechType,
		onStageChange,
		onTechTypeChange
	}: Props = $props();
</script>

<div class="global-filters">
	<div class="filter-group">
		<span class="filter-label">Stage:</span>
		<div class="stage-filter">
			<button class:active={selectedStage === 'all'} onclick={() => onStageChange('all')}>All</button>
			{#each stages as stg}
				<button class:active={selectedStage === stg.id} onclick={() => onStageChange(stg.id)}>{stg.short}</button>
			{/each}
		</div>
	</div>
	<div class="filter-group">
		<span class="filter-label">Tech:</span>
		<select class="tech-filter" value={selectedTechType} onchange={(e) => onTechTypeChange((e.target as HTMLSelectElement).value)}>
			<option value="all">All Types</option>
			{#each modelTypes as mt}
				<option value={mt.id}>{mt.name}</option>
			{/each}
		</select>
	</div>
</div>

<style>
	.global-filters {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.25rem 0.75rem;
		background: #1e293b;
		border-radius: 0.375rem;
	}

	.filter-group {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.filter-label {
		font-size: 0.6875rem;
		color: #64748b;
		text-transform: uppercase;
		font-weight: 500;
	}

	.stage-filter {
		display: flex;
		gap: 0.125rem;
	}

	.stage-filter button {
		padding: 0.25rem 0.5rem;
		background: transparent;
		border: none;
		border-radius: 0.25rem;
		font-size: 0.75rem;
		color: #94a3b8;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.stage-filter button:hover {
		background: #334155;
		color: #f1f5f9;
	}

	.stage-filter button.active {
		background: #3b82f6;
		color: white;
	}

	.tech-filter {
		padding: 0.25rem 0.5rem;
		border: 1px solid #334155;
		border-radius: 0.25rem;
		font-size: 0.75rem;
		background: #1e293b;
		color: #f1f5f9;
	}

	.tech-filter:focus {
		outline: none;
		border-color: #3b82f6;
	}
</style>
