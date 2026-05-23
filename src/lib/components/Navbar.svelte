<script lang="ts">
	interface Props {
		onMenuClick: () => void;
	}

	let { onMenuClick }: Props = $props();
</script>

<nav
	class="sticky top-0 z-50 border-b-2 border-border"
	style="background: var(--color-bg-nav); box-shadow: var(--shadow-nav);"
>
	<div class="mx-auto flex max-w-[1400px] items-center justify-between gap-8 px-[clamp(1.4rem,3vw,2.4rem)] py-4">
		<div class="flex items-center gap-4">
			<button
				onclick={onMenuClick}
				class="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border-none bg-transparent text-2xl text-text-heading transition-all duration-150 hover:bg-white/15"
				aria-label="Open menu"
			>
				&#9776;
			</button>
			<a
				href="/"
				class="font-display text-2xl font-bold text-text-heading no-underline"
			>
				Marching Order
			</a>
		</div>

		<div class="ml-auto flex items-center gap-3">
			<a
				href="/tracker"
				class="inline-flex items-center rounded-pill border-none px-5 py-2.5 font-ui text-sm font-semibold uppercase tracking-wider text-bg-paper no-underline transition-all duration-150 hover:-translate-y-0.5"
				style="background: var(--accent); box-shadow: var(--shadow-sm);"
			>
				Start Combat
			</a>
		</div>
	</div>
</nav>
