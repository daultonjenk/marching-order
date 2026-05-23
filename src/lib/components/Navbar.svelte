<script lang="ts">
	import { settings } from '$lib/stores.svelte';
	import { invalidateAll } from '$app/navigation';

	interface Props {
		onMenuClick: () => void;
	}

	let { onMenuClick }: Props = $props();

	function toggleTheme() {
		settings.update({ darkMode: !settings.current.darkMode });
	}

	async function seedDebugData() {
		await fetch('/api/debug', { method: 'POST' });
		await invalidateAll();
	}
</script>

<nav
	class="sticky top-0 z-50 border-b"
	style="background: var(--color-bg-nav); border-color: var(--nav-border); box-shadow: var(--shadow-nav);"
>
	<div class="mx-auto flex max-w-[1400px] items-center justify-between gap-8 px-[clamp(1.4rem,3vw,2.4rem)] py-4">
		<div class="flex items-center gap-4">
			<button
				onclick={onMenuClick}
				class="flex h-11 w-11 cursor-pointer items-center justify-center rounded-sm border-none bg-transparent text-2xl transition-all duration-150 hover:bg-[var(--nav-hover-bg)]"
				style="color: var(--color-text-nav);"
				aria-label="Open menu"
			>
				&#9776;
			</button>
			<a
				href="/"
				class="font-display text-2xl font-bold no-underline"
				style="color: var(--color-text-nav);"
			>
				Marching Order
			</a>
		</div>

		<div class="ml-auto flex items-center gap-3">
			<button
				type="button"
				onclick={seedDebugData}
				class="flex h-11 w-11 cursor-pointer items-center justify-center rounded-sm border-none bg-transparent transition-all duration-150 hover:bg-[var(--nav-hover-bg)]"
				style="color: var(--color-text-nav);"
				aria-label="Seed debug data"
				title="Seed debug data"
			>
				<svg class="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
					<rect x="3" y="3" width="18" height="18" rx="3" fill="none" stroke="currentColor" stroke-width="2"/>
					<circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
					<circle cx="15.5" cy="8.5" r="1.5" fill="currentColor"/>
					<circle cx="12" cy="12" r="1.5" fill="currentColor"/>
					<circle cx="8.5" cy="15.5" r="1.5" fill="currentColor"/>
					<circle cx="15.5" cy="15.5" r="1.5" fill="currentColor"/>
				</svg>
			</button>
			<button
				type="button"
				onclick={toggleTheme}
				class="flex h-11 w-11 cursor-pointer items-center justify-center rounded-sm border-none bg-transparent transition-all duration-150 hover:bg-[var(--nav-hover-bg)]"
				style="color: var(--color-text-nav);"
				aria-label={settings.current.darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
			>
				{#if settings.current.darkMode}
					<svg class="h-6 w-6" viewBox="0 0 24 24" aria-hidden="true">
						<circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2.2" />
						<path
							d="M12 2.5v3M12 18.5v3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M2.5 12h3M18.5 12h3M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1"
							fill="none"
							stroke="currentColor"
							stroke-linecap="round"
							stroke-width="2.2"
						/>
					</svg>
				{:else}
					<svg class="h-6 w-6" viewBox="0 0 24 24" aria-hidden="true">
						<path
							d="M20.2 14.7A7.7 7.7 0 0 1 9.3 3.8a8.7 8.7 0 1 0 10.9 10.9Z"
							fill="currentColor"
						/>
					</svg>
				{/if}
			</button>
		</div>
	</div>
</nav>
