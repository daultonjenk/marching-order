<script lang="ts">
	import { page } from '$app/state';

	interface Props {
		onMenuClick: () => void;
	}

	let { onMenuClick }: Props = $props();

	const isCombat = $derived(page.url.pathname === '/' || page.url.pathname === '/tracker');
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

		<div class="ml-auto flex items-center gap-3" class:hidden={isCombat}>
			<a
				href="/"
				class="inline-flex min-h-11 items-center rounded-sm border px-5 py-2.5 font-ui text-sm font-semibold uppercase tracking-wider text-bg-paper no-underline transition-all duration-150 hover:-translate-y-0.5"
				style="background: var(--accent); box-shadow: var(--shadow-sm);"
			>
				Start Combat
			</a>
		</div>
	</div>
</nav>
