<script lang="ts">
	import type { PartyMember } from '$lib/types';
	import { settings } from '$lib/stores.svelte';
	import { storage } from '$lib/storage';
	import { onMount, onDestroy } from 'svelte';

	let party = $state<PartyMember[]>([]);
	let currentIndex = $state(0);
	let visible = $state(true);
	let timer: ReturnType<typeof setInterval> | null = null;

	onMount(async () => {
		party = await storage.getParty();
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
</script>

<div class="flex min-h-[calc(100vh-120px)] items-center justify-center">
	{#if party.length === 0}
		<div class="text-center">
			<div class="mb-4 text-5xl">🎲</div>
			<p class="text-lg text-text-muted">No party members to display</p>
			<a
				href="/party"
				class="mt-4 inline-block font-semibold no-underline"
				style="color: var(--accent);"
			>
				Add party members &rarr;
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

			<div class="flex justify-center gap-8 text-xl text-text-muted">
				<span>Level {member.level}</span>
				<span>AC {member.ac}</span>
				{#if settings.current.showPlayerHp}
					<span>HP {member.currentHp}/{member.maxHp}</span>
				{/if}
			</div>
		</div>
	{/if}
</div>
