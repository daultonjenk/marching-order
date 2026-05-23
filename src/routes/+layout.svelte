<script lang="ts">
	import '../app.css';
	import Navbar from '$lib/components/Navbar.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import { settings } from '$lib/stores.svelte';
	import { onMount } from 'svelte';

	let { children } = $props();
	let sidebarOpen = $state(false);

	onMount(() => {
		settings.load();
	});
</script>

<svelte:head>
	<title>Marching Order</title>
	<meta name="description" content="D&D Initiative Tracker for Tabletop Play" />
</svelte:head>

<Sidebar isOpen={sidebarOpen} onClose={() => (sidebarOpen = false)} />
<Navbar onMenuClick={() => (sidebarOpen = true)} />

<main class="min-h-[calc(100vh-80px)] px-[clamp(1.4rem,3vw,2.4rem)] py-[clamp(1.4rem,3vw,2.4rem)]">
	{@render children()}
</main>
