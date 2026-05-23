<script lang="ts">
	import type { Combatant } from '$lib/types';
	import { settings } from '$lib/stores.svelte';

	interface Props {
		combatant: Combatant;
		variant: 'history' | 'active' | 'queue';
		activeBackground?: string;
		cornerSizePercent?: number;
	}

	let {
		combatant,
		variant,
		activeBackground = 'var(--color-bg-paper)',
		cornerSizePercent = 24
	}: Props = $props();

	const showExactHp = $derived(
		combatant.maxHp > 0 && combatant.type === 'player'
			? false
			: combatant.maxHp > 0 &&
					settings.current.showEnemyHp &&
					settings.current.enemyHpFormat === 'exact'
	);

	const showHpSeverity = $derived(
		combatant.maxHp > 0 &&
		combatant.type === 'enemy' &&
			settings.current.showEnemyHp &&
			settings.current.enemyHpFormat === 'severity'
	);

	const showAc = $derived(
		combatant.ac > 0 &&
			(combatant.type === 'player' ? settings.current.showPlayerAc : settings.current.showEnemyAc)
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

	const markerColor = $derived(combatant.markerColor ?? '#8f8a82');
	const cornerLength = $derived(
		`${Math.round(cornerSizePercent * (variant === 'active' ? 4.6 : 3.35))}px`
	);
</script>

{#if variant === 'active'}
	<div
		data-testid="active-combatant-card"
		class="relative mb-6 overflow-hidden rounded-md border-4 border-text-heading p-8 text-text-heading md:px-10 md:py-12"
		style="background: {activeBackground}; box-shadow: var(--shadow-md);"
	>
		<span
			class="absolute top-0 left-0"
			style="background: {markerColor}; width: {cornerLength}; height: {cornerLength}; clip-path: polygon(0 0, 100% 0, 0 100%);"
			aria-hidden="true"
		></span>
		<span
			class="absolute right-0 bottom-0"
			style="background: {markerColor}; width: {cornerLength}; height: {cornerLength}; clip-path: polygon(100% 0, 100% 100%, 0 100%);"
			aria-hidden="true"
		></span>
		<div class="relative z-10 flex min-h-28 items-center justify-between gap-6 pl-16 pr-10">
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
								class="inline-flex items-center gap-1.5 rounded-pill border border-border/50 bg-bg-paper px-5 py-2 text-lg font-semibold text-text-heading"
							>
								{status.label}
							</span>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
{:else}
	<div
		data-testid="{variant}-combatant-card"
		class="relative mb-4 overflow-hidden rounded-md border-2 border-border bg-bg-card p-6 transition-all duration-200 hover:-translate-y-0.5"
		class:opacity-60={combatant.isDown}
		style="box-shadow: var(--shadow-sm);"
	>
		<span
			class="absolute top-0 left-0"
			style="background: {markerColor}; width: {cornerLength}; height: {cornerLength}; clip-path: polygon(0 0, 100% 0, 0 100%);"
			aria-hidden="true"
		></span>
		<span
			class="absolute right-0 bottom-0"
			style="background: {markerColor}; width: {cornerLength}; height: {cornerLength}; clip-path: polygon(100% 0, 100% 100%, 0 100%);"
			aria-hidden="true"
		></span>
		<div class="relative z-10 flex items-center justify-between gap-6 pl-12 pr-8">
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
