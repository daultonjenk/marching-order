<script lang="ts">
	import type { Combatant } from '$lib/types';
	import { settings } from '$lib/stores.svelte';

	interface Props {
		combatant: Combatant;
		variant: 'history' | 'active' | 'queue';
	}

	let { combatant, variant }: Props = $props();

	const showExactHp = $derived(
		combatant.type === 'player'
			? settings.current.showPlayerHp
			: settings.current.showEnemyHp && settings.current.enemyHpFormat === 'exact'
	);

	const showHpSeverity = $derived(
		combatant.type === 'enemy' &&
			settings.current.showEnemyHp &&
			settings.current.enemyHpFormat === 'severity'
	);

	const showAc = $derived(
		combatant.type === 'player' ? true : settings.current.showEnemyAc
	);

	const hpSeverity = $derived.by(() => {
		if (combatant.maxHp === 0) return 'green';
		const ratio = combatant.currentHp / combatant.maxHp;
		if (ratio > 0.5) return 'green';
		if (ratio > 0.25) return 'yellow';
		return 'red';
	});

	const severityColors: Record<string, string> = {
		green: '#22c55e',
		yellow: '#eab308',
		red: '#ef4444'
	};
</script>

{#if variant === 'active'}
	<div
		data-testid="active-combatant-card"
		class="mb-6 rounded-md border-4 border-text-heading p-8 text-bg-paper md:px-10 md:py-12"
		style="background: var(--accent); box-shadow: 0 12px 32px var(--accent-shadow), 0 0 0 1px rgba(255,255,255,0.1) inset;"
	>
		<div class="flex items-center justify-between gap-6">
			<div class="flex-1">
				<div class="mb-3 font-display text-[clamp(2rem,5vw,3rem)] leading-tight font-bold">
					{combatant.name}
				</div>
				<div class="flex gap-8 text-[clamp(1.25rem,2.5vw,1.75rem)] opacity-95">
					{#if showExactHp}
						<span class="font-semibold" data-testid="combatant-hp">
							HP: {combatant.currentHp}/{combatant.maxHp}
						</span>
					{:else if showHpSeverity}
						<span class="flex items-center gap-2 font-semibold" data-testid="combatant-hp-severity">
							HP:
							<span
								class="inline-block h-4 w-4 rounded-full"
								style="background: {severityColors[hpSeverity]};"
							></span>
						</span>
					{/if}
					{#if showAc}
						<span class="font-semibold" data-testid="combatant-ac">AC: {combatant.ac}</span>
					{/if}
				</div>
				{#if combatant.statuses.length > 0}
					<div class="mt-4 flex flex-wrap gap-3">
						{#each combatant.statuses as status (status.id)}
							<span
								class="inline-flex items-center gap-1.5 rounded-pill border border-transparent bg-bg-paper px-5 py-2 text-lg font-semibold"
								style="color: var(--accent);"
							>
								{status.label}
							</span>
						{/each}
					</div>
				{/if}
			</div>
			<div class="text-6xl opacity-90">
				{combatant.type === 'player' ? '⚔️' : '💀'}
			</div>
		</div>
	</div>
{:else}
	<div
		data-testid="{variant}-combatant-card"
		class="mb-4 rounded-md border-2 border-border bg-bg-card p-6 transition-all duration-200 hover:-translate-y-0.5"
		class:opacity-60={combatant.isDown}
		style="box-shadow: var(--shadow-sm);"
	>
		<div class="flex items-center justify-between gap-6">
			<div class="flex-1">
				<div class="mb-2 font-display text-2xl leading-tight font-bold text-text-heading">
					{combatant.name}
				</div>
				<div class="flex gap-6 text-base opacity-95">
					{#if showExactHp}
						<span class="font-semibold" data-testid="combatant-hp">
							HP: {combatant.currentHp}/{combatant.maxHp}
						</span>
					{:else if showHpSeverity}
						<span class="flex items-center gap-2 font-semibold" data-testid="combatant-hp-severity">
							HP:
							<span
								class="inline-block h-3 w-3 rounded-full"
								style="background: {severityColors[hpSeverity]};"
							></span>
						</span>
					{/if}
					{#if showAc}
						<span class="font-semibold" data-testid="combatant-ac">AC: {combatant.ac}</span>
					{/if}
				</div>
				{#if combatant.statuses.length > 0}
					<div class="mt-3 flex flex-wrap gap-2">
						{#each combatant.statuses as status (status.id)}
							<span
								class="inline-flex items-center gap-1 rounded-pill border border-border/50 bg-black/5 px-3 py-1 text-sm font-semibold"
							>
								{status.label}
							</span>
						{/each}
					</div>
				{/if}
			</div>
			{#if combatant.isDown}
				<div class="text-2xl">💀</div>
			{/if}
		</div>
	</div>
{/if}
