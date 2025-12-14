<script lang="ts">
	import type { SelectedDetails, Link, Control, EntityType } from '../types';

	interface Props {
		selectedDetails: SelectedDetails;
		allControls: Control[];
		getControlSubcategory: (id: string) => any;
		getEntityName: (type: string, id: string) => string;
		onClose: () => void;
		onEditLink: (link: Link) => void;
		onStartConnect: (type: string, id: string, e: Event) => void;
		onEditEntity: (entityType: EntityType, entity: any) => void;
	}

	let {
		selectedDetails,
		allControls,
		getControlSubcategory,
		getEntityName,
		onClose,
		onEditLink,
		onStartConnect,
		onEditEntity
	}: Props = $props();
</script>

<aside class="detail-panel">
	<div class="detail-header">
		<h3>Details</h3>
		<button class="close-btn" onclick={onClose}>×</button>
	</div>

	{#if selectedDetails.type === 'question' && selectedDetails.item}
		{@const item = selectedDetails.item as any}
		<h3>{item.text}</h3>
		<div class="detail-meta">
			<span class="meta-item">ID: {item.id}</span>
			<span class="meta-item">Type: {item.type}</span>
		</div>
		<div class="detail-options">
			{#each item.options as opt}
				<span class="option-tag">{opt.label}</span>
			{/each}
		</div>
		{#if item.showIf}
			<div class="detail-section">
				<strong>Show Conditions:</strong>
				<div class="show-conditions">
					{#each Object.entries(item.showIf) as [qId, vals]}
						<span class="condition-badge">
							{qId} = {Array.isArray(vals) ? vals.join(', ') : vals}
						</span>
					{/each}
				</div>
			</div>
		{/if}
		<button class="btn edit-entity" onclick={() => onEditEntity('questions', item)}>
			Edit Question
		</button>
	{:else if selectedDetails.type === 'risk' && selectedDetails.item}
		{@const item = selectedDetails.item as any}
		<h3>{item.name}</h3>
		<div class="detail-meta">
			<span class="meta-item">Code: {item.code}</span>
			<span class="meta-item">Domain: {item.domain}</span>
		</div>
		<p class="detail-desc">{item.shortName}</p>
		<button class="btn edit-entity" onclick={() => onEditEntity('risks', item)}>
			Edit Risk
		</button>
	{:else if selectedDetails.type === 'mitigation' && selectedDetails.item}
		{@const item = selectedDetails.item as any}
		{@const subcategoryControls = allControls.filter(c => c.subcategoryId === item.id)}
		<h3>{item.name}</h3>
		<div class="detail-meta">
			<span class="meta-item">Code: {item.code}</span>
			<span class="meta-item">Category: {item.category}</span>
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
		{@const item = selectedDetails.item as any}
		<h3>{item.citation}</h3>
		<div class="detail-meta">
			<span class="meta-item">{item.framework}</span>
		</div>
		<p class="detail-desc">{item.description}</p>
		<button class="btn edit-entity" onclick={() => onEditEntity('regulations', item)}>
			Edit Regulation
		</button>
	{:else if selectedDetails.type === 'control' && selectedDetails.item}
		{@const item = selectedDetails.item as any}
		{@const subcategory = getControlSubcategory(item.subcategoryId)}
		<h3>{item.name}</h3>
		<div class="detail-meta">
			<span class="meta-item">ID: {item.id}</span>
			<span class="meta-item">Source: {item.source}</span>
		</div>
		{#if item.description}
			<p class="detail-desc">{item.description}</p>
		{/if}
		<div class="detail-section">
			<strong>Category:</strong>
			{#if subcategory}
				<span class="category-badge">{subcategory.code}: {subcategory.name}</span>
			{:else}
				<span>{item.subcategoryId}</span>
			{/if}
		</div>
		<div class="detail-section">
			<strong>Phases:</strong>
			<div class="phase-badges">
				{#each item.phases || [] as phase}
					<span class="phase-badge">{phase.replace('phase-', 'P')}</span>
				{/each}
			</div>
		</div>
		<div class="detail-section">
			<strong>Tech Types:</strong>
			<div class="tech-badges">
				{#each item.techTypes || [] as tech}
					<span class="tech-badge">{tech}</span>
				{/each}
			</div>
		</div>
		<button class="btn edit-entity" onclick={() => onEditEntity('controls', item)}>
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
					{@const isFrom = link.from.entity === selectedDetails.type && link.from.id === (selectedDetails.item as any)?.id}
					{@const otherEntity = isFrom ? link.to.entity : link.from.entity}
					{@const otherId = isFrom ? link.to.id : link.from.id}
					<button class="connection-item" onclick={() => onEditLink(link)}>
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

	<button class="btn connect-action" onclick={(e) => onStartConnect(selectedDetails.type, (selectedDetails.item as any)?.id || '', e)}>
		+ Create Connection
	</button>
</aside>

<style>
	.show-conditions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
		margin-top: 0.25rem;
	}

	.condition-badge {
		font-size: 0.7rem;
		background: var(--slate-100);
		padding: 0.125rem 0.375rem;
		border-radius: 3px;
	}
</style>
