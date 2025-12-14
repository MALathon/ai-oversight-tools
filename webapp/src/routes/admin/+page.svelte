<script lang="ts">
	import { browser } from '$app/environment';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const STORAGE_KEY = 'ai-oversight-traceability';

	// Load from localStorage or use default
	function loadLinks(): any[] {
		if (browser) {
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
	let selectedPhase = $state<string>('all');
	let selectedNode = $state<{ type: string; id: string } | null>(null);
	let connectingFrom = $state<{ type: string; id: string } | null>(null);
	let showLinkEditor = $state(false);
	let editingLink = $state<any>(null);
	let searchQuery = $state('');
	let focusMode = $state(false);

	// Build flat lists for each entity type
	let allQuestions = $derived.by(() => {
		const items: Array<{ id: string; text: string; type: string; category: string; options: Array<{ value: string; label: string }> }> = [];
		for (const cat of data.questionCategories) {
			for (const q of cat.questions) {
				let options: Array<{ value: string; label: string }> = [];
				if (q.type === 'yes-no') {
					options = [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }];
				} else if (q.options) {
					options = q.options.map((o: any) => ({ value: o.value, label: o.label }));
				}
				items.push({ id: q.id, text: q.question, type: q.type, category: cat.name, options });
			}
		}
		return items;
	});

	let allRisks = $derived(data.subdomains.map((s: any) => ({
		id: s.id,
		code: s.code,
		name: s.name,
		shortName: s.shortName,
		domain: s.domain
	})));

	let allMitigations = $derived.by(() => {
		const items: Array<{ id: string; code: string; name: string; category: string }> = [];
		for (const cat of data.mitigationCategories) {
			for (const m of cat.strategies) {
				items.push({ id: m.id, code: m.code, name: m.name, category: cat.name });
			}
		}
		return items;
	});

	let allRegulations = $derived.by(() => {
		const items: Array<{ id: string; citation: string; description: string; framework: string }> = [];
		for (const [key, reg] of Object.entries(data.regulations) as [string, any][]) {
			for (const sec of reg.sections) {
				items.push({ id: sec.id, citation: sec.citation, description: sec.description, framework: reg.title });
			}
		}
		return items;
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
			<div class="phase-filter">
				<button class:active={selectedPhase === 'all'} onclick={() => selectedPhase = 'all'}>All</button>
				{#each phases as phase}
					<button class:active={selectedPhase === phase.id} onclick={() => selectedPhase = phase.id}>{phase.short}</button>
				{/each}
			</div>
		</div>
		<div class="header-right">
			{#if hasLocalChanges}
				<span class="status-badge local">Local changes</span>
			{:else}
				<span class="status-badge default">Default</span>
			{/if}
			<button class="btn focus-toggle" class:active={focusMode} onclick={() => focusMode = !focusMode}>
				{focusMode ? 'Focus: ON' : 'Focus'}
			</button>
			<input type="text" placeholder="Search..." bind:value={searchQuery} class="search" />
			<input type="file" accept=".json" bind:this={fileInput} onchange={handleFileImport} style="display: none" />
			<button class="btn" onclick={importFile}>Import</button>
			<button class="btn primary" onclick={exportConfig}>Export</button>
			{#if hasLocalChanges}
				<button class="btn danger-outline" onclick={resetToDefault}>Reset</button>
			{/if}
		</div>
	</header>

	{#if connectingFrom}
		<div class="connection-banner">
			Connecting from: <strong>{getEntityName(connectingFrom.type, connectingFrom.id)}</strong> — Click another item to link them
			<button onclick={() => connectingFrom = null}>Cancel</button>
		</div>
	{:else if !selectedNode}
		<div class="help-banner">
			<strong>How to link:</strong> Click an item to select it, then click <span class="plus-hint">+</span> on it (or another item) to create a connection.
			Questions trigger Risks. Risks link to Mitigations and Regulations.
		</div>
	{/if}

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

			<!-- Mitigations Column -->
			<div class="column mitigations">
				<div class="column-header">
					<span class="column-icon">M</span>
					<h2>Mitigations</h2>
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
					<h3>{selectedDetails.item.name}</h3>
					<div class="detail-meta">
						<span class="meta-item">Code: {selectedDetails.item.code}</span>
						<span class="meta-item">Category: {selectedDetails.item.category}</span>
					</div>
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
</div>

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
					<span class="link-node {editingLink.from.entity}">{getEntityName(editingLink.from.entity, editingLink.from.id)}</span>
					<span class="link-arrow">→</span>
					<span class="link-node {editingLink.to.entity}">{getEntityName(editingLink.to.entity, editingLink.to.id)}</span>
				</div>

				<div class="form-group">
					<label>Link Type</label>
					<select bind:value={editingLink.type}>
						<option value="trigger">Trigger (Question triggers Risk)</option>
						<option value="mitigation">Mitigation (Risk linked to Mitigation)</option>
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
</style>
