<script lang="ts">
	import { untrack, tick } from 'svelte';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import type { Combatant, CombatState } from '$lib/types';
	import CombatantCard from '$lib/components/CombatantCard.svelte';
	import InitiativeSetup from '$lib/components/InitiativeSetup.svelte';
	import { ACCENT_COLORS } from '$lib/constants';
	import { settings } from '$lib/stores.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let combatState = $state<CombatState | null>(untrack(() => data.combatState));
	let phase = $state<'setup' | 'combat'>(untrack(() => (data.combatState ? 'combat' : 'setup')));
	let cornerSizePercent = $state(24);
	let transitionDuration = $state(440);
	let scrollContainer = $state<HTMLElement | null>(null);
	let activeZoneEl = $state<HTMLElement | null>(null);
	let flyY = $state(28);

	// Smoothly scrolls the timeline so the active card sits at ~40% from the top of the
	// container — enough history visible above, plenty of queue visible below.
	async function scrollToActive() {
		await tick();
		if (!scrollContainer || !activeZoneEl) return;
		const containerH = scrollContainer.clientHeight;
		const cardTop = activeZoneEl.offsetTop;
		const cardH = activeZoneEl.offsetHeight;
		const target = cardTop - containerH * 0.4 + cardH * 0.5;
		scrollContainer.scrollTo({ top: Math.max(0, target), behavior: 'smooth' });
	}

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

		flyY = 28;
		combatState = {
			...combatState,
			currentTurnIndex: nextIndex,
			round: nextRound,
			history: [...combatState.history, historyEntry]
		};
		saveCombatToServer(combatState);
		scrollToActive();
	}

	function previousTurn() {
		if (!combatState || combatState.history.length === 0) return;

		const lastEntry = combatState.history[combatState.history.length - 1];
		flyY = -28;
		combatState = {
			...combatState,
			currentTurnIndex: lastEntry.turnIndex,
			round: lastEntry.round,
			combatants: lastEntry.snapshot,
			history: combatState.history.slice(0, -1)
		};
		saveCombatToServer(combatState);
		scrollToActive();
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

	const historyTurns = $derived.by(() => {
		if (!combatState) return [];
		const history = combatState.history;
		const startIndex = Math.max(0, history.length - 15);
		return history
			.slice(startIndex)
			.map((entry, index) => ({
				combatant: entry.snapshot[entry.turnIndex],
				key: `${entry.round}-${entry.turnIndex}-${startIndex + index}`
			}))
			.filter((turn): turn is { combatant: Combatant; key: string } => Boolean(turn.combatant));
	});

	const activeCombatant = $derived(
		combatState ? combatState.combatants[combatState.currentTurnIndex] : null
	);

	type QueueItem = { combatant: Combatant; id: string; newRound?: number };

	// Builds up to 8 upcoming turns, wrapping into future rounds as needed.
	// When a wrap occurs the first alive combatant of the new round carries a
	// `newRound` label so the template can render a divider before it.
	const queueEntries = $derived.by((): QueueItem[] => {
		if (!combatState) return [];
		const combatants = combatState.combatants;
		const total = combatants.length;
		if (total === 0) return [];

		const items: QueueItem[] = [];
		let pos = combatState.currentTurnIndex;
		let round = combatState.round;
		let pendingRound = false;

		for (let step = 0; step < total * 10 && items.length < 8; step++) {
			if (pos === total - 1) {
				round++;
				pendingRound = true;
			}
			pos = (pos + 1) % total;

			const c = combatants[pos];
			if (!c || c.isDead) continue;

			const item: QueueItem = { combatant: c, id: `${c.id}-r${round}` };
			if (pendingRound) {
				item.newRound = round;
				pendingRound = false;
			}
			items.push(item);
		}
		return items;
	});
</script>

<svelte:window onkeydown={handleKeydown} />

{#if phase === 'setup'}
	<InitiativeSetup party={data.party} enemies={data.enemies} encounters={data.encounters} onStart={startCombat} />
{:else if combatState && activeCombatant}
	<div class="combat-shell mx-auto flex max-w-[1200px] flex-col overflow-hidden">
		<div class="flex flex-wrap items-center justify-end gap-3">
			<div
				class="mr-auto flex min-h-11 min-w-[82px] flex-col items-center justify-center rounded-sm px-4 py-2 text-bg-paper"
				style="background: var(--accent); box-shadow: var(--shadow-sm);"
			>
				<div class="font-ui text-[0.625rem] uppercase tracking-wider opacity-90">Round</div>
				<div class="text-xl leading-none font-bold" data-testid="round-counter">{combatState.round}</div>
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

			<details class="relative">
				<summary
					class="flex min-h-11 cursor-pointer list-none items-center rounded-sm border-2 border-border bg-bg-paper px-4 py-2.5 font-ui text-sm font-semibold uppercase tracking-wider text-text-heading transition-all duration-150 hover:border-[var(--accent)] hover:text-[var(--accent)]"
				>
					Tweaks
				</summary>
				<div
					class="absolute right-0 z-30 mt-2 w-56 rounded-sm border-2 border-border bg-bg-card p-4"
					style="box-shadow: var(--shadow-md);"
				>
					<label class="mb-4 flex items-center justify-between gap-3 text-sm font-semibold text-text-heading">
						Accent
						<input
							type="color"
							value={settings.current.accentColor}
							oninput={(event) => settings.update({ accentColor: event.currentTarget.value })}
							class="h-10 w-12 cursor-pointer rounded-sm border border-border bg-bg-paper"
						/>
					</label>
					<div class="mb-4 flex flex-wrap gap-2">
						{#each ACCENT_COLORS as color}
							<button
								type="button"
								onclick={() => settings.update({ accentColor: color.value })}
								class="h-8 w-8 cursor-pointer rounded-sm border-2 border-border"
								class:border-text-heading={settings.current.accentColor === color.value}
								style="background: {color.value};"
								aria-label="Use {color.label} accent"
							></button>
						{/each}
					</div>
					<label class="mb-4 block text-sm font-semibold text-text-heading">
						<span class="mb-2 flex justify-between gap-3">
							Corner size
							<span>{cornerSizePercent}</span>
						</span>
						<input
							type="range"
							min="18"
							max="30"
							step="1"
							bind:value={cornerSizePercent}
							class="w-full accent-[var(--accent)]"
						/>
					</label>
					<label class="block text-sm font-semibold text-text-heading">
						<span class="mb-2 flex justify-between gap-3">
							Turn transition
							<span>{transitionDuration}ms</span>
						</span>
						<input
							type="range"
							min="80"
							max="900"
							step="20"
							bind:value={transitionDuration}
							class="w-full accent-[var(--accent)]"
						/>
					</label>
				</div>
			</details>
		</div>

		<!-- Timeline: single unified scroll container. No split zones, no split scrollbars.
		     The active card smoothly scrolls to ~40% from top on each turn advance. -->
		<div class="relative mt-5 min-h-0 flex-1 pl-14">
			<div
				class="absolute top-0 bottom-0 left-4 w-3.5 rounded-full"
				style="background: var(--accent); box-shadow: 0 0 14px var(--accent-glow);"
			></div>

			<div class="timeline-scroll h-full overflow-y-auto" bind:this={scrollContainer}>
				<!-- History: full-size cards, dimmed. Scrollable by hand above the active card. -->
				{#if historyTurns.length > 0}
					<div class="pb-4 opacity-35" data-testid="turn-history">
						{#each historyTurns as turn (turn.key)}
							<CombatantCard combatant={turn.combatant} variant="queue" {cornerSizePercent} />
						{/each}
					</div>
				{/if}

				<!-- Active card: always scrolled to ~40% from top. Fly transition on turn change. -->
				<div bind:this={activeZoneEl}>
					<div
						class="mb-4 text-center font-ui text-lg font-semibold uppercase tracking-wider"
						style="color: var(--accent);"
					>
						&#9733; CURRENT TURN &#9733;
					</div>
					<div class="overflow-hidden">
						{#key activeCombatant.id}
							<div in:fly={{ y: flyY, duration: transitionDuration, easing: cubicOut }}>
								<CombatantCard combatant={activeCombatant} variant="active" {cornerSizePercent} />
							</div>
						{/key}
					</div>
				</div>

				<!-- Queue: next 8 turns, spanning into future rounds with dividers. -->
				{#if queueEntries.length > 0}
					<div class="pb-8 pt-1">
						<div
							class="mb-3 font-ui text-sm font-semibold uppercase tracking-wider"
							style="color: var(--accent);"
						>
							UP NEXT
						</div>
						{#each queueEntries as entry (entry.id)}
							{#if entry.newRound}
								<div class="my-3 flex items-center gap-3">
									<div class="h-px flex-1" style="background: var(--accent); opacity: 0.3;"></div>
									<span
										class="font-ui text-xs font-semibold uppercase tracking-widest"
										style="color: var(--accent); opacity: 0.6;"
									>
										Round {entry.newRound}
									</span>
									<div class="h-px flex-1" style="background: var(--accent); opacity: 0.3;"></div>
								</div>
							{/if}
							<CombatantCard combatant={entry.combatant} variant="queue" {cornerSizePercent} />
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.combat-shell {
		height: calc(100dvh - 76px - clamp(2.8rem, 6vw, 4.8rem));
	}
	/* Hide the scrollbar visually — the timeline is a continuous tape, not a windowed list. */
	.timeline-scroll {
		scrollbar-width: none;
	}
	.timeline-scroll::-webkit-scrollbar {
		display: none;
	}
</style>
