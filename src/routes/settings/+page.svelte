<script lang="ts">
	import { settings } from '$lib/stores.svelte';
</script>

<div class="mx-auto max-w-[800px]">
	<h1
		class="mb-8 text-center font-display text-[clamp(2rem,4vw,2.5rem)] font-bold text-text-heading"
	>
		Settings
	</h1>

	<!-- Display Settings -->
	<div
		class="mb-6 rounded-md border-2 border-border bg-bg-card p-8"
		style="box-shadow: var(--shadow-sm);"
	>
		<h2 class="mb-6 font-display text-xl font-bold text-text-heading">Display</h2>
		<div class="flex flex-col gap-6">
			<div class="flex items-center justify-between gap-6">
				<div class="flex-1">
					<div class="mb-1 font-semibold">Dark Mode</div>
					<div class="text-sm text-text-muted">Use the darker palette for dim rooms and projector play</div>
				</div>
				<button
					onclick={() => settings.update({ darkMode: !settings.current.darkMode })}
					class="relative h-8 w-14 cursor-pointer rounded-full border-none transition-colors duration-200"
					style="background: {settings.current.darkMode ? 'var(--accent)' : '#CAC2B8'};"
					role="switch"
					aria-checked={settings.current.darkMode}
					aria-label="Dark Mode"
				>
					<div
						class="absolute top-1 h-6 w-6 rounded-full bg-bg-paper transition-[left] duration-200"
						style="left: {settings.current.darkMode ? '28px' : '4px'}; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"
					></div>
				</button>
			</div>

			<div class="flex items-center justify-between gap-6">
				<div class="flex-1">
					<div class="mb-1 font-semibold">Wallpaper Background</div>
					<div class="text-sm text-text-muted">Show the subtle diamond texture behind app screens</div>
				</div>
				<button
					onclick={() => settings.update({ showWallpaper: !settings.current.showWallpaper })}
					class="relative h-8 w-14 cursor-pointer rounded-full border-none transition-colors duration-200"
					style="background: {settings.current.showWallpaper ? 'var(--accent)' : '#CAC2B8'};"
					role="switch"
					aria-checked={settings.current.showWallpaper}
					aria-label="Wallpaper Background"
				>
					<div
						class="absolute top-1 h-6 w-6 rounded-full bg-bg-paper transition-[left] duration-200"
						style="left: {settings.current.showWallpaper ? '28px' : '4px'}; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"
					></div>
				</button>
			</div>

			<div class="flex items-center justify-between gap-6">
				<div class="flex-1">
					<div class="mb-1 font-semibold">Show Player AC</div>
					<div class="text-sm text-text-muted">Display armor class for player characters</div>
				</div>
				<button
					onclick={() => settings.update({ showPlayerAc: !settings.current.showPlayerAc })}
					class="relative h-7 w-[52px] cursor-pointer rounded-full border-none transition-colors duration-200"
					style="background: {settings.current.showPlayerAc ? 'var(--accent)' : '#CAC2B8'};"
					role="switch"
					aria-checked={settings.current.showPlayerAc}
					aria-label="Show Player AC"
				>
					<div
						class="absolute top-1 h-5 w-5 rounded-full bg-bg-paper transition-[left] duration-200"
						style="left: {settings.current.showPlayerAc ? '28px' : '4px'}; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"
					></div>
				</button>
			</div>

			<div class="flex items-center justify-between gap-6">
				<div class="flex-1">
					<div class="mb-1 font-semibold">Show Enemy HP</div>
					<div class="text-sm text-text-muted">Display hit points for enemy combatants</div>
				</div>
				<button
					onclick={() => settings.update({ showEnemyHp: !settings.current.showEnemyHp })}
					class="relative h-7 w-[52px] cursor-pointer rounded-full border-none transition-colors duration-200"
					style="background: {settings.current.showEnemyHp ? 'var(--accent)' : '#CAC2B8'};"
					role="switch"
					aria-checked={settings.current.showEnemyHp}
					aria-label="Show Enemy HP"
				>
					<div
						class="absolute top-1 h-5 w-5 rounded-full bg-bg-paper transition-[left] duration-200"
						style="left: {settings.current.showEnemyHp ? '28px' : '4px'}; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"
					></div>
				</button>
			</div>

			<div class="flex items-center justify-between gap-6">
				<div class="flex-1">
					<div class="mb-1 font-semibold">Show Enemy AC</div>
					<div class="text-sm text-text-muted">Display armor class for enemy combatants</div>
				</div>
				<button
					onclick={() => settings.update({ showEnemyAc: !settings.current.showEnemyAc })}
					class="relative h-7 w-[52px] cursor-pointer rounded-full border-none transition-colors duration-200"
					style="background: {settings.current.showEnemyAc ? 'var(--accent)' : '#CAC2B8'};"
					role="switch"
					aria-checked={settings.current.showEnemyAc}
					aria-label="Show Enemy AC"
				>
					<div
						class="absolute top-1 h-5 w-5 rounded-full bg-bg-paper transition-[left] duration-200"
						style="left: {settings.current.showEnemyAc ? '28px' : '4px'}; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"
					></div>
				</button>
			</div>

			{#if settings.current.showEnemyHp}
				<div class="flex items-center justify-between gap-6">
					<div class="flex-1">
						<div class="mb-1 font-semibold">Enemy HP Format</div>
						<div class="text-sm text-text-muted">How to display enemy hit points</div>
					</div>
					<div class="flex gap-2">
						<button
							onclick={() => settings.update({ enemyHpFormat: 'exact' })}
							class="cursor-pointer rounded-pill border-2 px-4 py-1.5 text-sm font-semibold transition-all"
							style="border-color: {settings.current.enemyHpFormat === 'exact'
								? 'var(--accent)'
								: 'var(--color-border)'}; color: {settings.current.enemyHpFormat === 'exact'
								? 'var(--accent)'
								: 'inherit'};"
						>
							Exact
						</button>
						<button
							onclick={() => settings.update({ enemyHpFormat: 'severity' })}
							class="cursor-pointer rounded-pill border-2 px-4 py-1.5 text-sm font-semibold transition-all"
							style="border-color: {settings.current.enemyHpFormat === 'severity'
								? 'var(--accent)'
								: 'var(--color-border)'}; color: {settings.current.enemyHpFormat === 'severity'
								? 'var(--accent)'
								: 'inherit'};"
						>
							Severity Color
						</button>
					</div>
				</div>
			{/if}
		</div>
	</div>

</div>
