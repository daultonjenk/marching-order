<script lang="ts">
	import type { Combatant, CombatState, PartyMember, Enemy, Encounter } from '$lib/types';

	interface Props {
		party: PartyMember[];
		enemies: Enemy[];
		encounters: Encounter[];
		onStart: (state: CombatState) => void;
	}

	let { party, enemies, encounters, onStart }: Props = $props();

	let combatants = $state<Array<{ name: string; type: 'player' | 'enemy'; initiative: number; maxHp: number; ac: number; level?: number; passivePerception?: number }>>(
		party.map((p) => ({
			name: p.name,
			type: 'player' as const,
			initiative: 0,
			maxHp: p.maxHp,
			ac: p.ac,
			level: p.level,
			passivePerception: p.passivePerception
		}))
	);
	let step = $state<'select' | 'initiative'>('select');
	let currentInitiativeIndex = $state(0);
	let initiativeInput = $state('');

	function loadEncounter(encounter: Encounter) {
		for (const entry of encounter.entries) {
			const enemy = enemies.find((e) => e.id === entry.enemyId);
			if (!enemy) continue;
			for (let i = 0; i < entry.quantity; i++) {
				combatants = [
					...combatants,
					{
						name: entry.quantity > 1 ? `${enemy.name} ${i + 1}` : enemy.name,
						type: 'enemy',
						initiative: 0,
						maxHp: enemy.maxHp,
						ac: enemy.ac
					}
				];
			}
		}
	}

	function addManualEnemy(enemy: Enemy) {
		const existingCount = combatants.filter(
			(c) => c.type === 'enemy' && c.name.startsWith(enemy.name)
		).length;
		combatants = [
			...combatants,
			{
				name: existingCount > 0 ? `${enemy.name} ${existingCount + 1}` : enemy.name,
				type: 'enemy',
				initiative: 0,
				maxHp: enemy.maxHp,
				ac: enemy.ac
			}
		];
	}

	function removeCombatant(index: number) {
		combatants = combatants.filter((_, i) => i !== index);
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
			combatants: sorted.map((c, i) => ({
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
</script>

<div class="mx-auto max-w-[800px]">
	{#if step === 'select'}
		<div class="mb-8 text-center">
			<h1 class="mb-2 font-display text-[clamp(2rem,4vw,2.5rem)] font-bold text-text-heading">
				Combat Setup
			</h1>
			<p class="text-text-muted">Add combatants, then enter initiative rolls</p>
		</div>

		<!-- Current Combatants -->
		{#if combatants.length > 0}
			<div
				class="mb-6 rounded-md border-2 border-border bg-bg-card p-6"
				style="box-shadow: var(--shadow-sm);"
			>
				<h2 class="mb-4 font-display text-xl font-bold text-text-heading">
					Combatants ({combatants.length})
				</h2>
				<div class="flex flex-col gap-2">
					{#each combatants as c, i}
						<div
							class="flex items-center justify-between rounded-sm border border-border/50 bg-bg-paper px-4 py-3"
						>
							<div class="flex items-center gap-3">
								<span class="text-lg">
									{c.type === 'player' ? '⚔️' : '💀'}
								</span>
								<span class="font-semibold">{c.name}</span>
								<span class="text-sm text-text-muted">
									HP: {c.maxHp} &middot; AC: {c.ac}
								</span>
							</div>
							<button
								onclick={() => removeCombatant(i)}
								class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-none bg-transparent text-lg text-text-muted transition-colors hover:bg-red-100 hover:text-red-500"
								aria-label="Remove {c.name}"
							>
								&times;
							</button>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Load Encounter -->
		{#if encounters.length > 0}
			<div
				class="mb-6 rounded-md border-2 border-border bg-bg-card p-6"
				style="box-shadow: var(--shadow-sm);"
			>
				<h2 class="mb-4 font-display text-xl font-bold text-text-heading">
					Encounter Templates
				</h2>
				<div class="flex flex-col gap-2">
					{#each encounters as encounter}
						<button
							onclick={() => loadEncounter(encounter)}
							class="flex w-full cursor-pointer items-center justify-between rounded-sm border border-border/50 bg-bg-paper px-4 py-3 text-left transition-all hover:border-[var(--accent)]"
						>
							<span class="font-semibold">{encounter.name}</span>
							<span class="text-sm text-text-muted">
								{encounter.entries.reduce((sum, e) => sum + e.quantity, 0)} enemies
							</span>
						</button>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Add individual enemies -->
		{#if enemies.length > 0}
			<div
				class="mb-6 rounded-md border-2 border-border bg-bg-card p-6"
				style="box-shadow: var(--shadow-sm);"
			>
				<h2 class="mb-4 font-display text-xl font-bold text-text-heading">Add Enemies</h2>
				<div class="flex flex-wrap gap-2">
					{#each enemies as enemy}
						<button
							onclick={() => addManualEnemy(enemy)}
							class="cursor-pointer rounded-pill border-2 border-border bg-bg-paper px-4 py-2 font-ui text-sm font-semibold transition-all hover:border-[var(--accent)] hover:text-[var(--accent)]"
						>
							+ {enemy.name}
						</button>
					{/each}
				</div>
			</div>
		{/if}

		{#if party.length === 0 && enemies.length === 0}
			<div class="rounded-md border-2 border-border bg-bg-card p-8 text-center"
				style="box-shadow: var(--shadow-sm);">
				<p class="mb-4 text-text-muted">
					No party members or enemies yet. Add some first!
				</p>
				<div class="flex justify-center gap-4">
					<a
						href="/party"
						class="inline-flex rounded-pill border-none px-5 py-2.5 font-ui text-sm font-semibold uppercase tracking-wider text-bg-paper no-underline"
						style="background: var(--accent);"
					>
						Add Party Members
					</a>
					<a
						href="/enemies"
						class="inline-flex rounded-pill border-2 border-border px-5 py-2.5 font-ui text-sm font-semibold uppercase tracking-wider text-text-heading no-underline hover:border-[var(--accent)]"
					>
						Add Enemies
					</a>
				</div>
			</div>
		{/if}

		<!-- Begin button -->
		{#if combatants.length >= 2}
			<div class="mt-8 text-center">
				<button
					onclick={proceedToInitiative}
					class="cursor-pointer rounded-pill border-none px-8 py-4 font-ui text-lg font-bold uppercase tracking-wider text-bg-paper transition-all duration-150 hover:-translate-y-0.5"
					style="background: var(--accent); box-shadow: var(--shadow-md);"
				>
					Roll Initiative &rarr;
				</button>
			</div>
		{/if}
	{:else}
		<!-- Initiative Entry -->
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
			<div class="mb-2 text-4xl">
				{combatants[currentInitiativeIndex].type === 'player' ? '⚔️' : '💀'}
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
					{currentInitiativeIndex < combatants.length - 1 ? 'Next →' : 'Begin Combat!'}
				</button>
			</div>
		</div>

		<!-- Progress -->
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
	{/if}
</div>
