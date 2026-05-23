<script lang="ts">
	import type { PartyMember } from '$lib/types';
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let party = $derived(data.party);
	let editing = $state<PartyMember | null>(null);
	let showForm = $state(false);
	let showDisplayDetails = $state(false);

	let formName = $state('');
	let formAc = $state(10);
	let formMaxHp = $state(10);
	let formLevel = $state(1);
	let formPassivePerception = $state(10);

	function resetForm() {
		formName = '';
		formAc = 10;
		formMaxHp = 10;
		formLevel = 1;
		formPassivePerception = 10;
		editing = null;
		showForm = false;
		showDisplayDetails = false;
	}

	function editMember(member: PartyMember) {
		editing = member;
		formName = member.name;
		formAc = member.ac ?? 10;
		formMaxHp = member.maxHp ?? 10;
		formLevel = member.level ?? 1;
		formPassivePerception = member.passivePerception ?? 10;
		showForm = true;
		showDisplayDetails = false;
	}

	function toggleDisplayDetails() {
		showDisplayDetails = !showDisplayDetails;
		if (!showDisplayDetails) return;

		if (formAc <= 0) formAc = 10;
		if (formMaxHp <= 0) formMaxHp = 10;
		if (formLevel <= 0) formLevel = 1;
		if (formPassivePerception <= 0) formPassivePerception = 10;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && showForm) resetForm();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="mx-auto max-w-[800px]">
	<div class="mb-8 flex items-center justify-between">
		<div>
			<h1 class="font-display text-[clamp(2rem,4vw,2.5rem)] font-bold text-text-heading">
				Roster
			</h1>
			<p class="text-text-muted">Add names for combat. Display details are optional.</p>
		</div>
		{#if !showForm}
			<button
				onclick={() => (showForm = true)}
				class="cursor-pointer rounded-pill border-none px-5 py-2.5 font-ui text-sm font-semibold uppercase tracking-wider text-bg-paper transition-all duration-150 hover:-translate-y-0.5"
				style="background: var(--accent); box-shadow: var(--shadow-sm);"
			>
				+ Add Name
			</button>
		{/if}
	</div>

	<!-- Add/Edit Form -->
	{#if showForm}
		<div
			class="mb-8 rounded-md border-2 border-border bg-bg-card p-6"
			style="box-shadow: var(--shadow-sm);"
		>
			<h2 class="mb-4 font-display text-xl font-bold text-text-heading">
				{editing ? 'Edit' : 'Add'} Roster Name
			</h2>
			<form
				method="POST"
				action="?/save"
				use:enhance={() => {
					return async ({ update }) => {
						await update();
						resetForm();
					};
				}}
				class="flex flex-col gap-4"
			>
				<input type="hidden" name="id" value={editing?.id ?? crypto.randomUUID()} />
				<input
					type="hidden"
					name="currentHp"
					value={showDisplayDetails ? (editing?.currentHp ?? formMaxHp) : (editing?.currentHp ?? '')}
				/>
				{#if !showDisplayDetails}
					<input type="hidden" name="ac" value={editing?.ac ?? ''} />
					<input type="hidden" name="maxHp" value={editing?.maxHp ?? ''} />
					<input type="hidden" name="level" value={editing?.level ?? ''} />
					<input
						type="hidden"
						name="passivePerception"
						value={editing?.passivePerception ?? ''}
					/>
				{/if}
				<div>
					<label for="name" class="mb-1 block text-sm font-semibold">Name</label>
						<input
							id="name"
							name="name"
							type="text"
							bind:value={formName}
							placeholder="Name"
						class="w-full rounded-sm border-2 border-border bg-bg-paper px-4 py-3 text-base focus:border-[var(--accent)] focus:outline-none"
						autofocus
					/>
				</div>
				<button
					type="button"
					onclick={toggleDisplayDetails}
					class="w-fit cursor-pointer rounded-sm border border-border bg-bg-paper px-4 py-2 font-ui text-sm font-semibold uppercase tracking-wider text-text-heading transition-all hover:border-[var(--accent)] hover:text-[var(--accent)]"
					aria-expanded={showDisplayDetails}
				>
					{showDisplayDetails ? 'Hide' : 'Add'} Display Details
				</button>

				{#if showDisplayDetails}
					<div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
						<div>
							<label for="ac" class="mb-1 block text-sm font-semibold">AC</label>
							<input
								id="ac"
								name="ac"
								type="number"
								bind:value={formAc}
								min="1"
								class="w-full rounded-sm border-2 border-border bg-bg-paper px-4 py-3 text-base focus:border-[var(--accent)] focus:outline-none"
							/>
						</div>
						<div>
							<label for="maxHp" class="mb-1 block text-sm font-semibold">Max HP</label>
							<input
								id="maxHp"
								name="maxHp"
								type="number"
								bind:value={formMaxHp}
								min="1"
								class="w-full rounded-sm border-2 border-border bg-bg-paper px-4 py-3 text-base focus:border-[var(--accent)] focus:outline-none"
							/>
						</div>
						<div>
							<label for="level" class="mb-1 block text-sm font-semibold">Level</label>
							<input
								id="level"
								name="level"
								type="number"
								bind:value={formLevel}
								min="1"
								max="20"
								class="w-full rounded-sm border-2 border-border bg-bg-paper px-4 py-3 text-base focus:border-[var(--accent)] focus:outline-none"
							/>
						</div>
						<div>
							<label for="pp" class="mb-1 block text-sm font-semibold">Passive Perception</label>
							<input
								id="pp"
								name="passivePerception"
								type="number"
								bind:value={formPassivePerception}
								class="w-full rounded-sm border-2 border-border bg-bg-paper px-4 py-3 text-base focus:border-[var(--accent)] focus:outline-none"
							/>
						</div>
					</div>
				{/if}
				<div class="flex gap-3">
					<button
						type="submit"
							class="cursor-pointer rounded-pill border-none px-6 py-2.5 font-ui text-sm font-semibold uppercase tracking-wider text-bg-paper"
							style="background: var(--accent);"
						>
							{editing ? 'Save Changes' : 'Add to Roster'}
						</button>
					<button
						type="button"
						onclick={resetForm}
						class="cursor-pointer rounded-pill border-2 border-border bg-transparent px-6 py-2.5 font-ui text-sm font-semibold uppercase tracking-wider text-text-heading hover:border-[var(--accent)]"
					>
						Cancel
					</button>
				</div>
			</form>
		</div>
	{/if}

	<!-- Party List -->
	{#if party.length === 0 && !showForm}
		<div
			class="rounded-md border-2 border-border bg-bg-card p-12 text-center"
			style="box-shadow: var(--shadow-sm);"
		>
			<div class="mb-4 text-5xl">👥</div>
			<p class="mb-4 text-lg text-text-muted">No roster names yet</p>
			<button
				onclick={() => (showForm = true)}
				class="cursor-pointer rounded-pill border-none px-6 py-3 font-ui text-sm font-semibold uppercase tracking-wider text-bg-paper"
				style="background: var(--accent);"
			>
				Add First Name
			</button>
		</div>
	{:else}
		<div class="flex flex-col gap-4">
			{#each party as member (member.id)}
				<div
					class="rounded-md border-2 border-border bg-bg-card p-6 transition-all duration-200 hover:-translate-y-0.5"
					style="box-shadow: var(--shadow-sm);"
				>
					<div class="flex items-center justify-between gap-4">
						<div class="flex-1">
							<div class="mb-1 font-display text-2xl font-bold text-text-heading">
								{member.name}
							</div>
							<p class="text-sm text-text-muted">Ready for combat setup and slideshow.</p>
						</div>
						<div class="flex gap-2">
							<button
								onclick={() => editMember(member)}
								class="cursor-pointer rounded-sm border border-border bg-bg-paper px-3 py-2 text-sm font-semibold transition-all hover:border-[var(--accent)] hover:text-[var(--accent)]"
							>
								Edit
							</button>
							<form method="POST" action="?/delete" use:enhance>
								<input type="hidden" name="id" value={member.id} />
								<button
									type="submit"
									class="cursor-pointer rounded-sm border border-border bg-bg-paper px-3 py-2 text-sm font-semibold text-red-500 transition-all hover:border-red-500 hover:bg-red-50"
								>
									Delete
								</button>
							</form>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
