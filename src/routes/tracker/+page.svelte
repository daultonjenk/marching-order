<script lang="ts">
	import type { Combatant, CombatState } from '$lib/types';
	import { settings } from '$lib/stores.svelte';
	import CombatantCard from '$lib/components/CombatantCard.svelte';
	import InitiativeSetup from '$lib/components/InitiativeSetup.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let combatState = $state<CombatState | null>(data.combatState);
	let phase = $state<'setup' | 'combat'>(data.combatState ? 'combat' : 'setup');

	function saveCombatToServer(state: CombatState) {
		fetch('/api/combat', {
			method: 'POST',
			body: JSON.stringify(state),
			headers: { 'Content-Type': 'application/json' }
		});
	}

	function startCombat(state: CombatState) {
		combatState = state;
		phase = 'combat';
		saveCombatToServer(state);
	}

	function nextTurn() {
		if (!combatState) return;

		const snapshot: Combatant[] = combatState.combatants.map((c) => ({ ...c, statuses: [...c.statuses] }));
		const historyEntry = {
			turnIndex: combatState.currentTurnIndex,
			round: combatState.round,
			snapshot
		};

		let nextIndex = combatState.currentTurnIndex + 1;
		let nextRound = combatState.round;

		// Skip dead combatants
		const alive = combatState.combatants.filter((c) => !c.isDead);
		if (alive.length === 0) return;

		while (combatState.combatants[nextIndex % combatState.combatants.length]?.isDead) {
			nextIndex++;
			if (nextIndex >= combatState.combatants.length) {
				nextIndex = 0;
				nextRound++;
			}
		}

		if (nextIndex >= combatState.combatants.length) {
			nextIndex = 0;
			nextRound++;
			while (combatState.combatants[nextIndex]?.isDead) {
				nextIndex++;
			}
		}

		combatState = {
			...combatState,
			currentTurnIndex: nextIndex,
			round: nextRound,
			history: [...combatState.history, historyEntry]
		};
		saveCombatToServer(combatState);
	}

	function previousTurn() {
		if (!combatState || combatState.history.length === 0) return;

		const lastEntry = combatState.history[combatState.history.length - 1];
		combatState = {
			...combatState,
			currentTurnIndex: lastEntry.turnIndex,
			round: lastEntry.round,
			combatants: lastEntry.snapshot,
			history: combatState.history.slice(0, -1)
		};
		saveCombatToServer(combatState);
	}

	function endCombat() {
		combatState = null;
		phase = 'setup';
		fetch('/api/combat', { method: 'DELETE' });
	}

	function handleKeydown(e: KeyboardEvent) {
		if (phase !== 'combat' || !combatState) return;
		if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

		if (e.key === ' ' && !e.shiftKey) {
			e.preventDefault();
			nextTurn();
		} else if ((e.key === ' ' && e.shiftKey) || e.key === 'Backspace') {
			e.preventDefault();
			previousTurn();
		}
	}

	const historyCombatants = $derived.by(() => {
		if (!combatState) return [];
		const idx = combatState.currentTurnIndex;
		const result: Combatant[] = [];
		for (let i = Math.max(0, idx - 2); i < idx; i++) {
			if (!combatState.combatants[i]?.isDead) {
				result.push(combatState.combatants[i]);
			}
		}
		return result;
	});

	const activeCombatant = $derived(
		combatState ? combatState.combatants[combatState.currentTurnIndex] : null
	);

	const queueCombatants = $derived.by(() => {
		if (!combatState) return [];
		const idx = combatState.currentTurnIndex;
		const rest = combatState.combatants.slice(idx + 1).filter((c) => !c.isDead);
		const wrapped = combatState.combatants.slice(0, idx).filter((c) => !c.isDead);
		return [...rest, ...wrapped];
	});
</script>

<svelte:window onkeydown={handleKeydown} />

{#if phase === 'setup'}
	<InitiativeSetup party={data.party} enemies={data.enemies} encounters={data.encounters} onStart={startCombat} />
{:else if combatState && activeCombatant}
	<!-- Combat Controls -->
	<div class="mx-auto flex max-w-[1200px] flex-wrap items-center justify-end gap-3">
		<div
			class="mr-auto flex min-h-11 min-w-[82px] flex-col items-center justify-center rounded-sm px-4 py-2 text-bg-paper"
			style="background: var(--accent); box-shadow: var(--shadow-sm);"
		>
			<div class="font-ui text-[0.625rem] uppercase tracking-wider opacity-90">Round</div>
			<div class="text-xl leading-none font-bold">{combatState.round}</div>
		</div>

		<button
			onclick={nextTurn}
			class="min-h-11 cursor-pointer rounded-sm border-none px-5 py-2.5 font-ui text-sm font-semibold uppercase tracking-wider text-bg-paper transition-all duration-150 hover:-translate-y-0.5"
			style="background: var(--accent); box-shadow: var(--shadow-sm);"
		>
			Next Turn &rarr;
		</button>

		<button
			onclick={previousTurn}
			class="min-h-11 cursor-pointer rounded-sm border-2 border-border bg-bg-paper px-5 py-2.5 font-ui text-sm font-semibold uppercase tracking-wider text-text-heading transition-all duration-150 hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-45"
			disabled={combatState.history.length === 0}
		>
			&larr; Undo
		</button>

		<button
			onclick={endCombat}
			class="min-h-11 cursor-pointer rounded-sm border-2 border-border bg-bg-paper px-5 py-2.5 font-ui text-sm font-semibold uppercase tracking-wider text-text-heading transition-all duration-150 hover:border-[var(--accent)] hover:text-[var(--accent)]"
		>
			End Combat
		</button>
	</div>

	<!-- Timeline -->
	<div class="mx-auto mt-8 max-w-[1200px]">
		<div class="relative pl-14">
			<!-- Spine -->
			<div
				class="absolute top-0 bottom-0 left-4 w-3.5 rounded-full"
				style="background: var(--accent); box-shadow: 0 0 14px var(--accent-glow);"
			></div>

			<!-- History -->
			{#if historyCombatants.length > 0}
				<div class="mb-8 opacity-35">
					{#each historyCombatants as combatant (combatant.id)}
						<CombatantCard {combatant} variant="history" />
					{/each}
				</div>
			{/if}

			<!-- Active Turn -->
			<div class="mb-8">
				<div
					class="mb-5 text-center font-ui text-lg uppercase tracking-wider font-semibold"
					style="color: var(--accent);"
				>
					&#9733; CURRENT TURN &#9733;
				</div>
				<CombatantCard combatant={activeCombatant} variant="active" />
			</div>

			<!-- Queue -->
			{#if queueCombatants.length > 0}
				<div>
					<div
						class="mb-4 font-ui text-sm uppercase tracking-wider font-semibold"
						style="color: var(--accent);"
					>
						UP NEXT
					</div>
					{#each queueCombatants as combatant (combatant.id)}
						<CombatantCard {combatant} variant="queue" />
					{/each}
				</div>
			{/if}
		</div>
	</div>
{/if}
