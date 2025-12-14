<script lang="ts">
	import type { SelectedNode, QuestionDependencies } from '../types';

	interface Props {
		title: string;
		icon: string;
		count: number;
		totalCount: number;
		columnType: 'question' | 'risk' | 'mitigation' | 'regulation' | 'control';
		items: any[];
		selectedNode: SelectedNode | null;
		connectingFrom: SelectedNode | null;
		focusMode: boolean;
		isConnected: (type: string, id: string) => boolean;
		getLinkCount: (type: string, id: string) => number;
		getConnectionToSelected: (type: string, id: string) => any;
		onNodeClick: (type: string, id: string) => void;
		onStartConnect: (type: string, id: string, e: Event) => void;
		// Optional for questions
		getQuestionDeps?: (id: string) => QuestionDependencies;
		// Optional for mitigations
		getControlCount?: (id: string) => number;
		// Optional for controls
		getControlSubcategory?: (id: string) => any;
	}

	let {
		title,
		icon,
		count,
		totalCount,
		columnType,
		items,
		selectedNode,
		connectingFrom,
		focusMode,
		isConnected,
		getLinkCount,
		getConnectionToSelected,
		onNodeClick,
		onStartConnect,
		getQuestionDeps,
		getControlCount,
		getControlSubcategory
	}: Props = $props();

	function shouldHide(itemId: string): boolean {
		if (!focusMode || !selectedNode) return false;
		const isSelected = selectedNode?.type === columnType && selectedNode?.id === itemId;
		const connected = isConnected(columnType, itemId);
		return !isSelected && !connected;
	}
</script>

<div class="column {columnType}s">
	<div class="column-header">
		<span class="column-icon">{icon}</span>
		<h2>{title}</h2>
		<span class="count" title="{count} of {totalCount}">{count}</span>
	</div>
	<div class="nodes">
		{#each items as item}
			{@const linkCount = getLinkCount(columnType, item.id)}
			{@const isSelected = selectedNode?.type === columnType && selectedNode?.id === item.id}
			{@const connected = isConnected(columnType, item.id)}
			{@const connectionLink = getConnectionToSelected(columnType, item.id)}
			{@const hide = shouldHide(item.id)}
			{#if !hide}
				{#if columnType === 'question'}
					{@const deps = getQuestionDeps?.(item.id) ?? { dependsOn: [], dependedBy: [] }}
					<div
						class="node question"
						class:selected={isSelected}
						class:connected
						class:connecting={connectingFrom?.type === 'question' && connectingFrom?.id === item.id}
						class:has-deps={deps.dependsOn.length > 0 || deps.dependedBy.length > 0}
						role="button"
						tabindex="0"
						onclick={() => onNodeClick('question', item.id)}
						onkeydown={(e) => e.key === 'Enter' && onNodeClick('question', item.id)}
					>
						<div class="node-header">
							<span class="node-id">{item.id}</span>
							<span class="link-count" title="Connections">{linkCount}</span>
						</div>
						<div class="node-text">{item.text}</div>
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
						<button class="connect-btn" title="Connect to..." onclick={(e) => onStartConnect('question', item.id, e)}>+</button>
					</div>
				{:else if columnType === 'risk'}
					<div
						class="node risk"
						class:selected={isSelected}
						class:connected
						class:connecting={connectingFrom?.type === 'risk' && connectingFrom?.id === item.id}
						role="button"
						tabindex="0"
						onclick={() => onNodeClick('risk', item.id)}
						onkeydown={(e) => e.key === 'Enter' && onNodeClick('risk', item.id)}
					>
						<div class="node-header">
							<span class="node-code">{item.code}</span>
							<span class="link-count" title="Connections">{linkCount}</span>
						</div>
						<div class="node-text">{item.shortName}</div>
						{#if connected && connectionLink}
							<span class="conn-indicator">{connectionLink.type}</span>
						{/if}
						<button class="connect-btn" title="Connect to..." onclick={(e) => onStartConnect('risk', item.id, e)}>+</button>
					</div>
				{:else if columnType === 'mitigation'}
					{@const controlCount = getControlCount?.(item.id) ?? 0}
					<div
						class="node mitigation"
						class:selected={isSelected}
						class:connected
						class:connecting={connectingFrom?.type === 'mitigation' && connectingFrom?.id === item.id}
						role="button"
						tabindex="0"
						onclick={() => onNodeClick('mitigation', item.id)}
						onkeydown={(e) => e.key === 'Enter' && onNodeClick('mitigation', item.id)}
					>
						<div class="node-header">
							<span class="node-code">{item.code}</span>
							<span class="link-count" title="Risk links">{linkCount}</span>
						</div>
						<div class="node-text">{item.name}</div>
						<div class="node-meta">
							<span class="control-count" title="Controls in this category">{controlCount} controls</span>
						</div>
						{#if connected && connectionLink}
							<span class="conn-indicator">{connectionLink.type}</span>
						{/if}
						<button class="connect-btn" title="Connect to..." onclick={(e) => onStartConnect('mitigation', item.id, e)}>+</button>
					</div>
				{:else if columnType === 'regulation'}
					<div
						class="node regulation"
						class:selected={isSelected}
						class:connected
						class:connecting={connectingFrom?.type === 'regulation' && connectingFrom?.id === item.id}
						role="button"
						tabindex="0"
						onclick={() => onNodeClick('regulation', item.id)}
						onkeydown={(e) => e.key === 'Enter' && onNodeClick('regulation', item.id)}
					>
						<div class="node-header">
							<span class="node-code">{item.citation}</span>
							<span class="link-count" title="Connections">{linkCount}</span>
						</div>
						<div class="node-text">{item.description}</div>
						{#if connected && connectionLink}
							<span class="conn-indicator">{connectionLink.type}</span>
						{/if}
						<button class="connect-btn" title="Connect to..." onclick={(e) => onStartConnect('regulation', item.id, e)}>+</button>
					</div>
				{:else if columnType === 'control'}
					{@const subcategory = getControlSubcategory?.(item.subcategoryId)}
					<div
						class="node control"
						class:selected={isSelected}
						class:connected
						class:connecting={connectingFrom?.type === 'control' && connectingFrom?.id === item.id}
						role="button"
						tabindex="0"
						onclick={() => onNodeClick('control', item.id)}
						onkeydown={(e) => e.key === 'Enter' && onNodeClick('control', item.id)}
					>
						<div class="node-header">
							<span class="node-code">{item.id.split('_')[0]}</span>
							<span class="link-count" title="Via subcategory">{linkCount}</span>
						</div>
						<div class="node-text">{item.name}</div>
						<div class="node-meta">
							<span class="phases">{item.phases?.map((p: string) => p.replace('phase-', 'P')).join(' ')}</span>
							{#if subcategory}
								<span class="subcategory">{subcategory.code}</span>
							{/if}
						</div>
						{#if connected && connectionLink}
							<span class="conn-indicator">{connectionLink.type}</span>
						{/if}
						<button class="connect-btn" title="Connect to..." onclick={(e) => onStartConnect('control', item.id, e)}>+</button>
					</div>
				{/if}
			{/if}
		{/each}
	</div>
</div>
