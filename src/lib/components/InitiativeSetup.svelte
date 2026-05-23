<script lang="ts">
	import { untrack } from 'svelte';
	import type { CombatState, PartyMember, Enemy, Encounter } from '$lib/types';
	import { settings } from '$lib/stores.svelte';

	interface Props {
		party: PartyMember[];
		enemies: Enemy[];
		encounters: Encounter[];
		onStart: (state: CombatState) => void;
	}

	let { party, enemies, encounters, onStart }: Props = $props();

	type SetupCombatant = {
		id: string;
		name: string;
		type: 'player' | 'enemy';
		initiative: number;
		maxHp: number;
		ac: number;
		level?: number;
		passivePerception?: number;
		sourceId?: string;
		markerColor: string;
	};

	const markerPalette = ['#22c55e', '#3b82f6', '#f97316', '#a855f7', '#eab308', '#ef4444'];

	function nextMarkerColor() {
		return markerPalette[combatants.length % markerPalette.length];
	}

	let combatants = $state<SetupCombatant[]>(
		untrack(() =>
			party.map((p, index) => ({
				id: crypto.randomUUID(),
				name: p.name,
				type: 'player' as const,
				initiative: 0,
				maxHp: p.maxHp ?? 0,
				ac: p.ac ?? 0,
				level: p.level,
				passivePerception: p.passivePerception,
				sourceId: p.id,
				markerColor: markerPalette[index % markerPalette.length]
			}))
		)
	);
	let step = $state<'select' | 'initiative'>('select');
	let currentInitiativeIndex = $state(0);
	let initiativeInput = $state('');
	let addDialog = $state<'player' | 'enemy' | null>(null);
	let enemyDialogMode = $state<'enemy' | 'encounter'>('enemy');
	let editingCombatantId = $state<string | null>(null);
	let renameInput = $state('');
	let playerNameInput = $state('');
	let enemyNameInput = $state('');
	let selectedEncounterId = $state('');

	const playerCombatants = $derived(combatants.filter((c) => c.type === 'player'));
	const enemyCombatants = $derived(combatants.filter((c) => c.type === 'enemy'));
	const availableParty = $derived(
		party.filter((p) => !combatants.some((c) => c.type === 'player' && c.sourceId === p.id))
	);
	const selectedEncounter = $derived(encounters.find((e) => e.id === selectedEncounterId));

	function showExactHp(combatant: SetupCombatant) {
		if (combatant.maxHp <= 0) return false;
		return combatant.type === 'player'
			? false
			: settings.current.showEnemyHp && settings.current.enemyHpFormat === 'exact';
	}

	function showHpSeverity(combatant: SetupCombatant) {
		if (combatant.maxHp <= 0) return false;
		return (
			combatant.type === 'enemy' &&
			settings.current.showEnemyHp &&
			settings.current.enemyHpFormat === 'severity'
		);
	}

	function showAc(combatant: SetupCombatant) {
		if (combatant.ac <= 0) return false;
		return combatant.type === 'player' ? settings.current.showPlayerAc : settings.current.showEnemyAc;
	}

	function nextDisplayName(type: 'player' | 'enemy', name: string, forceNumbered = false) {
		const existingCount = combatants.filter(
			(c) => c.type === type && (c.name === name || c.name.startsWith(`${name} `))
		).length;
		if (type === 'enemy' && (forceNumbered || existingCount > 0)) {
			return `${name} ${existingCount + 1}`;
		}
		return name;
	}

	function openAddDialog(type: 'player' | 'enemy') {
		addDialog = type;
		enemyDialogMode = 'enemy';
		playerNameInput = '';
		enemyNameInput = '';
		selectedEncounterId = encounters[0]?.id ?? '';
	}

	function closeAddDialog() {
		addDialog = null;
		enemyDialogMode = 'enemy';
		playerNameInput = '';
		enemyNameInput = '';
	}

	function addQuickCombatant(type: 'player' | 'enemy', name: string) {
		const trimmedName = name.trim();
		if (!trimmedName) return;

		combatants = [
			...combatants,
			{
				id: crypto.randomUUID(),
				name: nextDisplayName(type, trimmedName),
				type,
				initiative: 0,
				maxHp: 0,
				ac: 0,
				markerColor: nextMarkerColor()
			}
		];
	}

	function addPartyMember(member: PartyMember) {
		if (combatants.some((c) => c.type === 'player' && c.sourceId === member.id)) return;
		combatants = [
			...combatants,
			{
				id: crypto.randomUUID(),
				name: member.name,
				type: 'player',
				initiative: 0,
				maxHp: member.maxHp ?? 0,
				ac: member.ac ?? 0,
				level: member.level,
				passivePerception: member.passivePerception,
				sourceId: member.id,
				markerColor: nextMarkerColor()
			}
		];
	}

	function addFullParty() {
		if (availableParty.length === 0) return;
		for (const member of availableParty) {
			addPartyMember(member);
		}
		closeAddDialog();
	}

	function confirmPlayerAdd() {
		const name = playerNameInput.trim();
		if (!name) return;

		const rosterMatch = party.find((p) => p.name === name);
		if (rosterMatch) {
			addPartyMember(rosterMatch);
		} else {
			addQuickCombatant('player', name);
		}
		closeAddDialog();
	}

	function loadEncounter(encounter: Encounter) {
		for (const entry of encounter.entries) {
			const enemy = enemies.find((e) => e.id === entry.enemyId);
			if (!enemy) continue;
			for (let i = 0; i < entry.quantity; i++) {
				combatants = [
					...combatants,
					{
						id: crypto.randomUUID(),
						name: nextDisplayName('enemy', enemy.name, entry.quantity > 1),
						type: 'enemy',
						initiative: 0,
						maxHp: enemy.maxHp,
						ac: enemy.ac,
						sourceId: enemy.id,
						markerColor: nextMarkerColor()
					}
				];
			}
		}
	}

	function addManualEnemy(enemy: Enemy) {
		combatants = [
			...combatants,
			{
				id: crypto.randomUUID(),
				name: nextDisplayName('enemy', enemy.name),
				type: 'enemy',
			initiative: 0,
			maxHp: enemy.maxHp,
			ac: enemy.ac,
			sourceId: enemy.id,
			markerColor: nextMarkerColor()
		}
	];
}

	function confirmEnemyAdd() {
		const name = enemyNameInput.trim();
		if (!name) return;

		const enemyMatch = enemies.find((e) => e.name === name);
		if (enemyMatch) {
			addManualEnemy(enemyMatch);
		} else {
			addQuickCombatant('enemy', name);
		}
		closeAddDialog();
	}

	function addSelectedEncounter() {
		if (!selectedEncounter) return;
		loadEncounter(selectedEncounter);
		closeAddDialog();
	}

	function submitEnemyDialog() {
		if (enemyDialogMode === 'encounter') {
			addSelectedEncounter();
			return;
		}
		confirmEnemyAdd();
	}

	function removeCombatant(id: string) {
		combatants = combatants.filter((c) => c.id !== id);
		if (editingCombatantId === id) {
			editingCombatantId = null;
			renameInput = '';
		}
	}

	function updateMarkerColor(id: string, color: string) {
		combatants = combatants.map((c) => (c.id === id ? { ...c, markerColor: color } : c));
	}

	function startRename(combatant: SetupCombatant) {
		editingCombatantId = combatant.id;
		renameInput = combatant.name;
	}

	function cancelRename() {
		editingCombatantId = null;
		renameInput = '';
	}

	function saveRename(id: string) {
		const name = renameInput.trim();
		if (!name) return;
		combatants = combatants.map((c) => (c.id === id ? { ...c, name } : c));
		cancelRename();
	}

	function handleRenameKeydown(e: KeyboardEvent, id: string) {
		if (e.key === 'Enter') {
			e.preventDefault();
			saveRename(id);
		} else if (e.key === 'Escape') {
			e.preventDefault();
			cancelRename();
		}
	}

	function proceedToInitiative() {
		if (combatants.length < 2) return;
		step = 'initiative';
		currentInitiativeIndex = 0;
		initiativeInput = '';
	}

	function submitInitiative() {
		const value = parseInt(initiativeInput, 10);
		if (isNaN(value)) return;

		combatants[currentInitiativeIndex].initiative = value;
		combatants = [...combatants];
		initiativeInput = '';

		if (currentInitiativeIndex < combatants.length - 1) {
			currentInitiativeIndex++;
		} else {
			beginCombat();
		}
	}

	function beginCombat() {
		const sorted = [...combatants].sort((a, b) => b.initiative - a.initiative);
		const state: CombatState = {
			combatants: sorted.map((c) => ({
				id: crypto.randomUUID(),
				name: c.name,
				type: c.type,
				initiative: c.initiative,
				currentHp: c.maxHp,
				maxHp: c.maxHp,
				ac: c.ac,
				level: c.level,
				passivePerception: c.passivePerception,
				statuses: [],
				isDown: false,
				isDead: false,
				markerColor: c.markerColor
			})),
			currentTurnIndex: 0,
			round: 1,
			history: []
		};
		onStart(state);
	}

	function handleInitiativeKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === 'Tab') {
			e.preventDefault();
			submitInitiative();
		}
	}

	function handleWindowKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && addDialog) {
			closeAddDialog();
		}
	}
</script>

{#snippet PencilIcon()}
	<svg class="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
		<path d="M4 16.7V20h3.3L18.8 8.5l-3.3-3.3L4 16.7Z" fill="currentColor" />
		<path
			d="m17 3.7 1.3-1.3a1.4 1.4 0 0 1 2 0l1.3 1.3a1.4 1.4 0 0 1 0 2L20.3 7 17 3.7Z"
			fill="currentColor"
		/>
		<path d="M3.5 22h17" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2" />
	</svg>
{/snippet}

{#snippet ChevronDownIcon()}
	<span class="h-3 w-3 rotate-45 border-r-2 border-b-2 border-current" aria-hidden="true"></span>
{/snippet}

<svelte:window onkeydown={handleWindowKeydown} />

{#if step === 'select'}
	<div class="mx-auto max-w-[1180px]">
		<header class="mb-6 border-b-2 border-border pb-4">
			<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div class="min-w-0">
					<h1
						class="font-display text-[clamp(2.2rem,4vw,3rem)] leading-none font-bold text-text-heading"
					>
						Combat Setup
					</h1>
				</div>
				<button
					onclick={proceedToInitiative}
					disabled={combatants.length < 2}
					class="min-h-14 w-full cursor-pointer rounded-sm border-none px-10 py-3 font-ui text-lg font-bold uppercase tracking-wider text-bg-paper transition-all duration-150 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 md:w-auto"
					style="background: var(--accent); box-shadow: var(--shadow-sm);"
				>
					Roll Initiative &rarr;
				</button>
			</div>
		</header>

		<div class="grid gap-6 lg:grid-cols-2">
			<section
				data-testid="players-setup-column"
				class="overflow-hidden rounded-md border-2 border-border bg-bg-card"
				style="box-shadow: var(--shadow-sm);"
			>
				<div class="flex min-h-20 items-center justify-between gap-4 border-b-2 border-border bg-bg-paper px-5 py-4">
					<div>
						<h2 class="font-display text-3xl leading-none font-bold text-text-heading">Players</h2>
						<p class="mt-1 text-sm text-text-muted">
							{playerCombatants.length} in the lineup
						</p>
					</div>
					<button
						type="button"
						onclick={() => openAddDialog('player')}
						class="flex h-14 w-14 shrink-0 cursor-pointer items-center justify-center rounded-sm border-2 border-border bg-bg-card font-ui text-4xl leading-none font-bold text-[var(--accent)] transition-colors hover:border-[var(--accent)] hover:bg-bg-paper"
						aria-label="Add player"
						data-testid="open-player-add"
					>
						+
					</button>
				</div>

				<div class="min-h-[360px] p-5">
					{#if playerCombatants.length > 0}
						<div class="flex flex-col gap-2">
							{#each playerCombatants as c (c.id)}
								<div
									data-testid="setup-combatant"
									class="flex min-h-14 items-center justify-between gap-3 rounded-sm border border-border/50 bg-bg-paper px-4 py-3"
								>
									<div class="flex min-w-0 flex-1 items-center gap-3">
										<label
											class="relative h-8 w-8 shrink-0 cursor-pointer overflow-hidden rounded-sm border-2 border-border"
											style="background: {c.markerColor};"
										>
											<span class="sr-only">Set color for {c.name}</span>
											<input
												type="color"
												value={c.markerColor}
												oninput={(event) => updateMarkerColor(c.id, event.currentTarget.value)}
												class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
											/>
										</label>
										<div class="min-w-0 flex-1">
											{#if editingCombatantId === c.id}
												<input
													type="text"
													bind:value={renameInput}
													onkeydown={(event) => handleRenameKeydown(event, c.id)}
													class="w-full rounded-sm border-2 border-border bg-bg-card px-3 py-2 font-semibold text-text-heading focus:border-[var(--accent)] focus:outline-none"
													aria-label="Rename {c.name}"
												/>
											{:else}
												<div class="truncate font-semibold text-text-heading">{c.name}</div>
											{/if}
										{#if showExactHp(c) || showAc(c)}
											<div class="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-text-muted">
												{#if showExactHp(c)}
													<span data-testid="setup-combatant-hp">HP: {c.maxHp}</span>
												{/if}
												{#if showAc(c)}
													<span data-testid="setup-combatant-ac">AC: {c.ac}</span>
												{/if}
											</div>
										{/if}
										</div>
									</div>
									{#if editingCombatantId === c.id}
										<button
											type="button"
											onclick={() => saveRename(c.id)}
											class="min-h-11 shrink-0 cursor-pointer rounded-sm border border-border/60 bg-transparent px-3 font-ui text-xs font-semibold uppercase tracking-wider text-text-heading transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
										>
											Save
										</button>
										<button
											type="button"
											onclick={cancelRename}
											class="min-h-11 shrink-0 cursor-pointer rounded-sm border border-border/60 bg-transparent px-3 font-ui text-xs font-semibold uppercase tracking-wider text-text-muted transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
										>
											Cancel
										</button>
									{:else}
										<button
											type="button"
											onclick={() => startRename(c)}
											class="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-sm border border-border/60 bg-transparent text-text-muted transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
											aria-label="Rename {c.name}"
										>
											{@render PencilIcon()}
										</button>
									{/if}
									<button
										onclick={() => removeCombatant(c.id)}
										class="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-sm border border-border/60 bg-transparent text-2xl leading-none text-text-muted transition-colors hover:border-red-400 hover:bg-red-100 hover:text-red-600"
										aria-label="Remove {c.name}"
									>
										&minus;
									</button>
								</div>
							{/each}
						</div>
					{:else}
						<div
							class="rounded-sm border border-dashed border-border bg-bg-paper px-4 py-10 text-center text-sm text-text-muted"
						>
							Add at least one player or ally for this fight.
						</div>
					{/if}
				</div>
			</section>

			<section
				data-testid="enemies-setup-column"
				class="overflow-hidden rounded-md border-2 border-border bg-bg-card"
				style="box-shadow: var(--shadow-sm);"
			>
				<div class="flex min-h-20 items-center justify-between gap-4 border-b-2 border-border bg-bg-paper px-5 py-4">
					<div>
						<h2 class="font-display text-3xl leading-none font-bold text-text-heading">Enemies</h2>
						<p class="mt-1 text-sm text-text-muted">
							{enemyCombatants.length} in the lineup
						</p>
					</div>
					<button
						type="button"
						onclick={() => openAddDialog('enemy')}
						class="flex h-14 w-14 shrink-0 cursor-pointer items-center justify-center rounded-sm border-2 border-border bg-bg-card font-ui text-4xl leading-none font-bold text-[var(--accent)] transition-colors hover:border-[var(--accent)] hover:bg-bg-paper"
						aria-label="Add enemy"
						data-testid="open-enemy-add"
					>
						+
					</button>
				</div>

				<div class="min-h-[360px] p-5">
					{#if enemyCombatants.length > 0}
						<div class="flex flex-col gap-2">
							{#each enemyCombatants as c (c.id)}
								<div
									data-testid="setup-combatant"
									class="flex min-h-14 items-center justify-between gap-3 rounded-sm border border-border/50 bg-bg-paper px-4 py-3"
								>
									<div class="flex min-w-0 flex-1 items-center gap-3">
										<label
											class="relative h-8 w-8 shrink-0 cursor-pointer overflow-hidden rounded-sm border-2 border-border"
											style="background: {c.markerColor};"
										>
											<span class="sr-only">Set color for {c.name}</span>
											<input
												type="color"
												value={c.markerColor}
												oninput={(event) => updateMarkerColor(c.id, event.currentTarget.value)}
												class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
											/>
										</label>
										<div class="min-w-0 flex-1">
											{#if editingCombatantId === c.id}
												<input
													type="text"
													bind:value={renameInput}
													onkeydown={(event) => handleRenameKeydown(event, c.id)}
													class="w-full rounded-sm border-2 border-border bg-bg-card px-3 py-2 font-semibold text-text-heading focus:border-[var(--accent)] focus:outline-none"
													aria-label="Rename {c.name}"
												/>
											{:else}
												<div class="truncate font-semibold text-text-heading">{c.name}</div>
											{/if}
										{#if showExactHp(c) || showHpSeverity(c) || showAc(c)}
											<div class="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-text-muted">
												{#if showExactHp(c)}
													<span data-testid="setup-combatant-hp">HP: {c.maxHp}</span>
												{:else if showHpSeverity(c)}
													<span class="flex items-center gap-1.5" data-testid="setup-combatant-hp-severity">
														HP:
														<span class="inline-block h-2.5 w-2.5 rounded-full bg-green-500"></span>
													</span>
												{/if}
												{#if showAc(c)}
													<span data-testid="setup-combatant-ac">AC: {c.ac}</span>
												{/if}
											</div>
										{/if}
										</div>
									</div>
									{#if editingCombatantId === c.id}
										<button
											type="button"
											onclick={() => saveRename(c.id)}
											class="min-h-11 shrink-0 cursor-pointer rounded-sm border border-border/60 bg-transparent px-3 font-ui text-xs font-semibold uppercase tracking-wider text-text-heading transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
										>
											Save
										</button>
										<button
											type="button"
											onclick={cancelRename}
											class="min-h-11 shrink-0 cursor-pointer rounded-sm border border-border/60 bg-transparent px-3 font-ui text-xs font-semibold uppercase tracking-wider text-text-muted transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
										>
											Cancel
										</button>
									{:else}
										<button
											type="button"
											onclick={() => startRename(c)}
											class="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-sm border border-border/60 bg-transparent text-text-muted transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
											aria-label="Rename {c.name}"
										>
											{@render PencilIcon()}
										</button>
									{/if}
									<button
										onclick={() => removeCombatant(c.id)}
										class="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-sm border border-border/60 bg-transparent text-2xl leading-none text-text-muted transition-colors hover:border-red-400 hover:bg-red-100 hover:text-red-600"
										aria-label="Remove {c.name}"
									>
										&minus;
									</button>
								</div>
							{/each}
						</div>
					{:else}
						<div
							class="rounded-sm border border-dashed border-border bg-bg-paper px-4 py-10 text-center text-sm text-text-muted"
						>
							Add at least one enemy, hazard, or summoned creature.
						</div>
					{/if}
				</div>
			</section>
		</div>

		{#if party.length === 0 && enemies.length === 0 && encounters.length === 0 && combatants.length === 0}
			<div
				class="mt-6 rounded-md border-2 border-border bg-bg-card p-6 text-center"
				style="box-shadow: var(--shadow-sm);"
			>
				<p class="text-text-muted">
					No saved roster names, enemies, or templates yet. Quick add is ready for this fight.
				</p>
			</div>
		{/if}
	</div>

	{#if addDialog}
		<div
			class="fixed inset-0 z-40 flex items-center justify-center bg-text-heading/30 p-4"
			role="presentation"
			onclick={(event) => {
				if (event.currentTarget === event.target) closeAddDialog();
			}}
		>
			<div
				class="w-full max-w-[620px] rounded-md border-2 border-border bg-bg-card p-5"
				style="box-shadow: var(--shadow-lg);"
				role="dialog"
				aria-modal="true"
				aria-labelledby="add-combatant-title"
				data-testid={addDialog === 'player' ? 'player-add-dialog' : 'enemy-add-dialog'}
			>
				<div class="mb-4 flex items-center justify-between gap-4">
					<div class="flex flex-wrap items-center gap-3">
						<h2 id="add-combatant-title" class="font-display text-2xl font-bold text-text-heading">
							Add {addDialog === 'player'
								? 'Player'
								: enemyDialogMode === 'enemy'
									? 'Enemy'
									: 'Encounter'}
						</h2>
						{#if addDialog === 'enemy'}
							<div class="flex rounded-sm border border-border bg-bg-paper p-1" aria-label="Enemy add mode">
								<button
									type="button"
									onclick={() => (enemyDialogMode = 'enemy')}
									class="min-h-9 cursor-pointer rounded-sm border-none px-3 font-ui text-xs font-semibold uppercase tracking-wider transition-colors"
									class:bg-bg-card={enemyDialogMode === 'enemy'}
									class:text-text-heading={enemyDialogMode === 'enemy'}
									class:text-text-muted={enemyDialogMode !== 'enemy'}
								>
									Enemy
								</button>
								<button
									type="button"
									onclick={() => (enemyDialogMode = 'encounter')}
									class="min-h-9 cursor-pointer rounded-sm border-none px-3 font-ui text-xs font-semibold uppercase tracking-wider transition-colors"
									class:bg-bg-card={enemyDialogMode === 'encounter'}
									class:text-text-heading={enemyDialogMode === 'encounter'}
									class:text-text-muted={enemyDialogMode !== 'encounter'}
								>
									Encounter
								</button>
							</div>
						{/if}
					</div>
					<button
						type="button"
						onclick={closeAddDialog}
						class="flex h-11 w-11 cursor-pointer items-center justify-center rounded-sm border border-border/60 bg-bg-paper text-2xl leading-none text-text-muted transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
						aria-label="Close add combatant"
					>
						&times;
					</button>
				</div>

				{#if addDialog === 'player'}
					<form
						class="space-y-5"
						onsubmit={(event) => {
							event.preventDefault();
							confirmPlayerAdd();
						}}
					>
						<div>
							<label class="sr-only" for="player-combatant-name">Player name</label>
							<div class="flex min-h-14 overflow-hidden rounded-sm border-2 border-border bg-bg-paper focus-within:border-[var(--accent)]">
								<input
									id="player-combatant-name"
									data-testid="player-combatant-name"
									type="text"
									bind:value={playerNameInput}
									placeholder="Type a name here"
									list="party-member-options"
									class="min-w-0 flex-1 bg-transparent px-4 text-lg text-text-heading placeholder:text-text-muted focus:outline-none"
								/>
								<div class="relative w-16 border-l-2 border-border bg-bg-card">
									<select
										aria-label="Choose party member"
										class="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent text-transparent focus:outline-none"
										value=""
										onchange={(event) => {
											const target = event.currentTarget;
											playerNameInput = target.value;
											target.value = '';
										}}
									>
										<option value=""></option>
										{#each availableParty as member}
											<option value={member.name}>{member.name}</option>
										{/each}
									</select>
									<span
										class="pointer-events-none absolute inset-0 flex items-center justify-center text-text-heading"
										aria-hidden="true"
									>
										{@render ChevronDownIcon()}
									</span>
								</div>
							</div>
							<datalist id="party-member-options">
								{#each availableParty as member}
									<option value={member.name}></option>
								{/each}
							</datalist>
						</div>

						<div class="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
							<button
								type="button"
								onclick={addFullParty}
								disabled={availableParty.length === 0}
								class="min-h-11 cursor-pointer rounded-sm border-2 border-border bg-bg-paper px-5 py-2.5 font-ui text-sm font-semibold uppercase tracking-wider text-text-heading transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-45"
							>
								Add Full Party
							</button>
							<button
								type="submit"
								disabled={!playerNameInput.trim()}
								class="min-h-11 cursor-pointer rounded-sm border-none px-6 py-3 font-ui text-sm font-bold uppercase tracking-wider text-bg-paper transition-all duration-150 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
								style="background: var(--accent); box-shadow: var(--shadow-sm);"
							>
								Confirm
							</button>
						</div>
					</form>
				{:else}
					<form
						class="space-y-5"
						onsubmit={(event) => {
							event.preventDefault();
							submitEnemyDialog();
						}}
					>
						{#if enemyDialogMode === 'enemy'}
							<div>
								<label class="sr-only" for="enemy-combatant-name">Enemy name</label>
								<div class="flex min-h-14 overflow-hidden rounded-sm border-2 border-border bg-bg-paper focus-within:border-[var(--accent)]">
									<input
										id="enemy-combatant-name"
										data-testid="enemy-combatant-name"
										type="text"
										bind:value={enemyNameInput}
										placeholder="Type a name here"
										list="enemy-options"
										class="min-w-0 flex-1 bg-transparent px-4 text-lg text-text-heading placeholder:text-text-muted focus:outline-none"
									/>
									<div class="relative w-16 border-l-2 border-border bg-bg-card">
										<select
											aria-label="Choose enemy"
											class="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent text-transparent focus:outline-none"
											value=""
											onchange={(event) => {
												const target = event.currentTarget;
												enemyNameInput = target.value;
												target.value = '';
											}}
										>
											<option value=""></option>
											{#each enemies as enemy}
												<option value={enemy.name}>{enemy.name}</option>
											{/each}
										</select>
										<span
											class="pointer-events-none absolute inset-0 flex items-center justify-center text-text-heading"
											aria-hidden="true"
										>
											{@render ChevronDownIcon()}
										</span>
									</div>
								</div>
								<datalist id="enemy-options">
									{#each enemies as enemy}
										<option value={enemy.name}></option>
									{/each}
								</datalist>
							</div>
						{:else}
							<div>
								<label class="sr-only" for="encounter-select">Encounter template</label>
								<select
									id="encounter-select"
									bind:value={selectedEncounterId}
									disabled={encounters.length === 0}
									class="min-h-14 w-full rounded-sm border-2 border-border bg-bg-paper px-4 text-lg text-text-heading disabled:opacity-45"
								>
									{#if encounters.length === 0}
										<option value="">No encounter templates</option>
									{:else}
										{#each encounters as encounter}
											<option value={encounter.id}>{encounter.name}</option>
										{/each}
									{/if}
								</select>
							</div>
						{/if}

						<div class="flex justify-end">
							<button
								type="submit"
								disabled={enemyDialogMode === 'enemy' ? !enemyNameInput.trim() : !selectedEncounter}
								class="min-h-11 cursor-pointer rounded-sm border-none px-6 py-3 font-ui text-sm font-bold uppercase tracking-wider text-bg-paper transition-all duration-150 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
								style="background: var(--accent); box-shadow: var(--shadow-sm);"
							>
								{enemyDialogMode === 'enemy' ? 'Confirm' : 'Add Encounter'}
							</button>
						</div>
					</form>
				{/if}
			</div>
		</div>
	{/if}
{:else}
	<div class="mx-auto max-w-[800px]">
		<div class="mb-8 text-center">
			<h1 class="mb-2 font-display text-[clamp(2rem,4vw,2.5rem)] font-bold text-text-heading">
				Enter Initiative
			</h1>
			<p class="text-text-muted">
				{currentInitiativeIndex + 1} of {combatants.length}
			</p>
		</div>

		<div
			class="mx-auto max-w-[500px] rounded-md border-4 border-text-heading p-10 text-center text-bg-paper"
			style="background: {combatants[currentInitiativeIndex].markerColor}; box-shadow: 0 12px 32px {combatants[currentInitiativeIndex].markerColor}73;"
		>
			<div class="mb-2 font-ui text-sm font-bold uppercase tracking-wider opacity-80">
				{combatants[currentInitiativeIndex].type === 'player' ? 'Player' : 'Enemy'}
			</div>
			<div class="mb-6 font-display text-4xl font-bold">
				{combatants[currentInitiativeIndex].name}
			</div>
			<input
				type="text"
				inputmode="numeric"
				bind:value={initiativeInput}
				onkeydown={handleInitiativeKeydown}
				placeholder="Initiative roll"
				class="mb-4 w-full max-w-[200px] rounded-md border-2 border-white/30 bg-white/20 p-4 text-center text-3xl font-bold text-bg-paper placeholder:text-white/50 focus:border-white focus:outline-none"
				autofocus
			/>
			<div>
				<button
					onclick={submitInitiative}
					class="cursor-pointer rounded-pill border-2 border-white/30 bg-white/20 px-8 py-3 font-ui text-sm font-bold uppercase tracking-wider text-bg-paper transition-all hover:bg-white/30"
				>
					{currentInitiativeIndex < combatants.length - 1 ? 'Next' : 'Begin Combat!'}
				</button>
			</div>
		</div>

		<div class="mt-6 flex justify-center gap-2">
			{#each combatants as c, i}
				<div
					class="h-2 w-8 rounded-full transition-all"
					style="background: {i < currentInitiativeIndex
						? c.markerColor + '99'
						: i === currentInitiativeIndex
							? c.markerColor
							: 'var(--color-border)'};"
				></div>
			{/each}
		</div>
	</div>
{/if}
