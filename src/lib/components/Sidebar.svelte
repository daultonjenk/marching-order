<script lang="ts">
	import { page } from '$app/state';

	interface Props {
		isOpen: boolean;
		onClose: () => void;
	}

	let { isOpen, onClose }: Props = $props();

	const navItems = [
		{ href: '/', label: 'Home', icon: '🏠' },
		{ href: '/party', label: 'Roster', icon: '👥' },
		{ href: '/enemies', label: 'Enemies', icon: '🐉' },
		{ href: '/tracker', label: 'Combat', icon: '⚔️' },
		{ href: '/idle', label: 'Slideshow', icon: '🖼️' },
		{ href: '/settings', label: 'Settings', icon: '⚙️' }
	];

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onClose();
	}
</script>

<svelte:window onkeydown={isOpen ? handleKeydown : undefined} />

<!-- Overlay -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="fixed inset-0 z-[110] transition-opacity duration-250"
	class:opacity-0={!isOpen}
	class:pointer-events-none={!isOpen}
	class:opacity-100={isOpen}
	class:pointer-events-auto={isOpen}
	style="background: rgba(0, 0, 0, 0.4);"
	onclick={onClose}
	onkeydown={handleKeydown}
></div>

<!-- Drawer -->
<div
	class="fixed top-0 bottom-0 left-0 z-[120] flex w-[280px] flex-col border-r-2 border-border bg-bg-card transition-transform duration-250"
	class:-translate-x-full={!isOpen}
	class:translate-x-0={isOpen}
	style="box-shadow: var(--shadow-lg);"
>
	<div class="flex items-center justify-between border-b-2 border-border p-6">
		<span class="font-display text-xl font-bold text-text-heading">Menu</span>
		<button
			onclick={onClose}
			class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border-none bg-transparent text-2xl text-text-heading transition-all duration-150 hover:bg-black/5"
			aria-label="Close menu"
		>
			&lsaquo;
		</button>
	</div>

	<nav class="flex-1 overflow-y-auto py-4">
		{#each navItems as item}
			<a
				href={item.href}
				onclick={onClose}
				class="flex w-full items-center gap-3 border-none px-6 py-3.5 text-left font-ui text-[0.9375rem] font-semibold uppercase tracking-wider no-underline transition-all duration-150 hover:bg-black/5"
				class:text-bg-paper={page.url.pathname === item.href}
				class:text-text-primary={page.url.pathname !== item.href}
				style={page.url.pathname === item.href ? `background: var(--accent);` : ''}
			>
				<span class="text-xl">{item.icon}</span>
				{item.label}
			</a>
		{/each}
	</nav>
</div>
