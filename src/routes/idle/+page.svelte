<script lang="ts">
	import { settings } from '$lib/stores.svelte';
	import { onMount, onDestroy } from 'svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let party = $derived(data.party);
	let currentIndex = $state(0);
	let visible = $state(true);
	let timer: ReturnType<typeof setInterval> | null = null;

	onMount(() => {
		if (party.length > 1) {
			startSlideshow();
		}
	});

	onDestroy(() => {
		if (timer) clearInterval(timer);
	});

	function startSlideshow() {
		const duration = (settings.current.idleSlideDuration || 10) * 1000;
		timer = setInterval(() => {
			visible = false;
			setTimeout(() => {
				currentIndex = (currentIndex + 1) % party.length;
				visible = true;
			}, 500);
		}, duration);
	}

	const member = $derived(party[currentIndex]);
	const initials = $derived(
		member
			? member.name
					.split(' ')
					.map((w) => w[0])
					.join('')
					.toUpperCase()
					.slice(0, 2)
			: ''
	);

	const showLevel = $derived(Boolean(member && member.level > 0));
	const showAc = $derived(Boolean(member && member.ac > 0 && settings.current.showPlayerAc));
	const showHp = $derived(Boolean(member && member.maxHp > 0 && settings.current.showPlayerHp));
	const showPassivePerception = $derived(Boolean(member && member.passivePerception > 0));
</script>

<div class="flex min-h-[calc(100vh-120px)] items-center justify-center">
	{#if party.length === 0}
		<div class="text-center">
			<div class="mb-4 text-5xl">🎲</div>
			<p class="text-lg text-text-muted">No roster names to display</p>
			<a
				href="/party"
				class="mt-4 inline-block font-semibold no-underline"
				style="color: var(--accent);"
			>
				Add roster names &rarr;
			</a>
		</div>
	{:else if member}
		<div
			class="text-center transition-opacity duration-500"
			class:opacity-0={!visible}
			class:opacity-100={visible}
		>
			<!-- Portrait placeholder -->
			<div
				class="mx-auto mb-8 flex h-40 w-40 items-center justify-center rounded-full border-4 border-text-heading font-display text-5xl font-bold text-bg-paper"
				style="background: var(--accent);"
			>
				{initials}
			</div>

			<h1 class="mb-4 font-display text-[clamp(3rem,8vw,5rem)] font-bold text-text-heading">
				{member.name}
			</h1>

			{#if showLevel || showAc || showHp || showPassivePerception}
				<div class="flex flex-wrap justify-center gap-8 text-xl text-text-muted">
					{#if showLevel}
						<span>Level {member.level}</span>
					{/if}
					{#if showAc}
						<span>AC {member.ac}</span>
					{/if}
					{#if showHp}
						<span>HP {member.currentHp}/{member.maxHp}</span>
					{/if}
					{#if showPassivePerception}
						<span>PP {member.passivePerception}</span>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>
