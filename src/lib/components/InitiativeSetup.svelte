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
	};

	let combatants = $state<SetupCombatant[]>(
		untrack(() =>
			party.map((p) => ({
				id: crypto.randomUUID(),
				name: p.name,
				type: 'player' as const,
				initiative: 0,
				maxHp: p.maxHp ?? 0,
				ac: p.ac ?? 0,
				level: p.level,
				passivePerception: p.passivePerception,
				sourceId: p.id
			}))
		)
	);
	let step = $state<'select' | 'initiative'>('select');
	let currentInitiativeIndex = $state(0);
	let initiativeInput = $state('');
	let addDialog = $state<'player' | 'enemy' | null>(null);
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
			? settings.current.showPlayerHp
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
		playerNameInput = '';
		enemyNameInput = '';
		selectedEncounterId = encounters[0]?.id ?? '';
	}

	function closeAddDialog() {
		addDialog = null;
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
				ac: 0
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
				sourceId: member.id
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
						sourceId: enemy.id
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
				sourceId: enemy.id
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

	function removeCombatant(id: string) {
		combatants = combatants.filter((c) => c.id !== id);
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
				isDead: false
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

<svelte:window onkeydown={handleWindowKeydown} />

{#if step === 'select'}
	<div class="mx-auto max-w-[1180px]">
		<header class="mb-7 border-b-2 border-border pb-5">
			<div class="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
				<div class="min-w-0">
					<p class="mb-2 font-ui text-xs font-semibold uppercase tracking-wider text-text-muted">
						Marching Order
					</p>
					<h1
						class="font-display text-[clamp(2.2rem,4vw,3rem)] leading-tight font-bold text-text-heading"
					>
						Combat Setup
					</h1>
					<div class="mt-3 flex flex-wrap gap-2 text-sm text-text-muted">
						<span class="rounded-sm border border-border bg-bg-card px-3 py-1">
							{playerCombatants.length} player{playerCombatants.length === 1 ? '' : 's'}
						</span>
						<span class="rounded-sm border border-border bg-bg-card px-3 py-1">
							{enemyCombatants.length} enem{enemyCombatants.length === 1 ? 'y' : 'ies'}
						</span>
						<span class="rounded-sm border border-border bg-bg-card px-3 py-1">
							{combatants.length} total
						</span>
					</div>
				</div>
				<button
					onclick={proceedToInitiative}
					disabled={combatants.length < 2}
					class="min-h-11 w-full cursor-pointer rounded-sm border-none px-6 py-3 font-ui text-sm font-bold uppercase tracking-wider text-bg-paper transition-all duration-150 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 md:w-auto"
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
									<div class="min-w-0">
										<div class="truncate font-semibold text-text-heading">{c.name}</div>
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
									<div class="min-w-0">
										<div class="truncate font-semibold text-text-heading">{c.name}</div>
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
					<h2 id="add-combatant-title" class="font-display text-2xl font-bold text-text-heading">
						Add {addDialog === 'player' ? 'Player' : 'Enemy'}
					</h2>
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
								<select
									aria-label="Choose party member"
									class="w-16 cursor-pointer border-l-2 border-border bg-bg-card text-center text-text-heading focus:outline-none"
									value=""
									onchange={(event) => {
										const target = event.currentTarget;
										playerNameInput = target.value;
										target.value = '';
									}}
								>
									<option value="">+</option>
									{#each availableParty as member}
										<option value={member.name}>{member.name}</option>
									{/each}
								</select>
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
							confirmEnemyAdd();
						}}
					>
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
								<select
									aria-label="Choose enemy"
									class="w-16 cursor-pointer border-l-2 border-border bg-bg-card text-center text-text-heading focus:outline-none"
									value=""
									onchange={(event) => {
										const target = event.currentTarget;
										enemyNameInput = target.value;
										target.value = '';
									}}
								>
									<option value="">+</option>
									{#each enemies as enemy}
										<option value={enemy.name}>{enemy.name}</option>
									{/each}
								</select>
							</div>
							<datalist id="enemy-options">
								{#each enemies as enemy}
									<option value={enemy.name}></option>
								{/each}
							</datalist>
						</div>

						<div class="rounded-sm border border-border/60 bg-bg-paper p-3">
							<div class="flex flex-col gap-3 sm:flex-row">
								<label class="sr-only" for="encounter-select">Encounter template</label>
								<select
									id="encounter-select"
									bind:value={selectedEncounterId}
									disabled={encounters.length === 0}
									class="min-h-11 flex-1 rounded-sm border-2 border-border bg-bg-card px-3 text-text-heading disabled:opacity-45"
								>
									{#if encounters.length === 0}
										<option value="">No encounter templates</option>
									{:else}
										{#each encounters as encounter}
											<option value={encounter.id}>{encounter.name}</option>
										{/each}
									{/if}
								</select>
								<button
									type="button"
									onclick={addSelectedEncounter}
									disabled={!selectedEncounter}
									class="min-h-11 cursor-pointer rounded-sm border-2 border-border bg-bg-card px-5 py-2.5 font-ui text-sm font-semibold uppercase tracking-wider text-text-heading transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-45"
								>
									Add Encounter
								</button>
							</div>
						</div>

						<div class="flex justify-end">
							<button
								type="submit"
								disabled={!enemyNameInput.trim()}
								class="min-h-11 cursor-pointer rounded-sm border-none px-6 py-3 font-ui text-sm font-bold uppercase tracking-wider text-bg-paper transition-all duration-150 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
								style="background: var(--accent); box-shadow: var(--shadow-sm);"
							>
								Confirm
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
			style="background: var(--accent); box-shadow: 0 12px 32px var(--accent-shadow);"
		>
			<div class="mb-2 font-ui text-sm font-bold uppercase tracking-wider opacity-80">
				{combatants[currentInitiativeIndex].type === 'player' ? 'Player' : 'Enemy'}
			</div>
			<div class="mb-6 font-display text-4xl font-bold">
				{combatants[currentInitiativeIndex].name}
			</div>
			<input
				type="number"
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
						? 'var(--accent)'
						: i === currentInitiativeIndex
							? 'var(--accent-light)'
							: 'var(--color-border)'};"
				></div>
			{/each}
		</div>
	</div>
{/if}
