<script lang="ts">
	import type { Enemy, Encounter } from '$lib/types';
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let enemies = $derived(data.enemies);
	let encounters = $derived(data.encounters);

	let showEnemyForm = $state(false);
	let editingEnemy = $state<Enemy | null>(null);
	let enemyName = $state('');
	let enemyMaxHp = $state(10);
	let enemyAc = $state(10);
	let enemyAbilities = $state('');

	let showEncounterForm = $state(false);
	let editingEncounter = $state<Encounter | null>(null);
	let encounterName = $state('');
	let encounterNotes = $state('');
	let encounterEntries = $state<Array<{ enemyId: string; quantity: number }>>([]);

	function resetEnemyForm() {
		enemyName = '';
		enemyMaxHp = 10;
		enemyAc = 10;
		enemyAbilities = '';
		editingEnemy = null;
		showEnemyForm = false;
	}

	function editEnemy(enemy: Enemy) {
		editingEnemy = enemy;
		enemyName = enemy.name;
		enemyMaxHp = enemy.maxHp;
		enemyAc = enemy.ac;
		enemyAbilities = enemy.abilities ?? '';
		showEnemyForm = true;
	}

	function resetEncounterForm() {
		encounterName = '';
		encounterNotes = '';
		encounterEntries = [];
		editingEncounter = null;
		showEncounterForm = false;
	}

	function editEncounter(encounter: Encounter) {
		editingEncounter = encounter;
		encounterName = encounter.name;
		encounterNotes = encounter.notes ?? '';
		encounterEntries = encounter.entries.map((e) => ({ ...e }));
		showEncounterForm = true;
	}

	function addEntryToEncounter(enemyId: string) {
		const existing = encounterEntries.find((e) => e.enemyId === enemyId);
		if (existing) {
			existing.quantity++;
			encounterEntries = [...encounterEntries];
		} else {
			encounterEntries = [...encounterEntries, { enemyId, quantity: 1 }];
		}
	}

	function removeEntryFromEncounter(enemyId: string) {
		encounterEntries = encounterEntries.filter((e) => e.enemyId !== enemyId);
	}

	function getEnemyName(id: string): string {
		return enemies.find((e: Enemy) => e.id === id)?.name ?? 'Unknown';
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			if (showEnemyForm) resetEnemyForm();
			if (showEncounterForm) resetEncounterForm();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="mx-auto max-w-[800px]">
	<div class="mb-8">
		<h1 class="mb-1 font-display text-[clamp(2rem,4vw,2.5rem)] font-bold text-text-heading">
			Enemy Library
		</h1>
		<p class="text-text-muted">Custom enemies and encounter templates</p>
	</div>

	<!-- Custom Enemies Section -->
	<div class="mb-10">
		<div class="mb-4 flex items-center justify-between">
			<h2 class="font-display text-xl font-bold text-text-heading">Custom Enemies</h2>
			{#if !showEnemyForm}
				<button
					onclick={() => (showEnemyForm = true)}
					class="cursor-pointer rounded-pill border-none px-5 py-2 font-ui text-sm font-semibold uppercase tracking-wider text-bg-paper"
					style="background: var(--accent);"
				>
					+ Add Enemy
				</button>
			{/if}
		</div>

		{#if showEnemyForm}
			<div
				class="mb-6 rounded-md border-2 border-border bg-bg-card p-6"
				style="box-shadow: var(--shadow-sm);"
			>
				<form
					method="POST"
					action="?/saveEnemy"
					use:enhance={() => {
						return async ({ update }) => {
							await update();
							resetEnemyForm();
						};
					}}
					class="flex flex-col gap-4"
				>
					<input type="hidden" name="id" value={editingEnemy?.id ?? crypto.randomUUID()} />
					<div>
						<label for="ename" class="mb-1 block text-sm font-semibold">Name</label>
						<input
							id="ename"
							name="name"
							type="text"
							bind:value={enemyName}
							placeholder="e.g., Goblin"
							class="w-full rounded-sm border-2 border-border bg-bg-paper px-4 py-3 focus:border-[var(--accent)] focus:outline-none"
							autofocus
						/>
					</div>
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label for="ehp" class="mb-1 block text-sm font-semibold">Max HP</label>
							<input
								id="ehp"
								name="maxHp"
								type="number"
								bind:value={enemyMaxHp}
								min="1"
								class="w-full rounded-sm border-2 border-border bg-bg-paper px-4 py-3 focus:border-[var(--accent)] focus:outline-none"
							/>
						</div>
						<div>
							<label for="eac" class="mb-1 block text-sm font-semibold">AC</label>
							<input
								id="eac"
								name="ac"
								type="number"
								bind:value={enemyAc}
								min="1"
								class="w-full rounded-sm border-2 border-border bg-bg-paper px-4 py-3 focus:border-[var(--accent)] focus:outline-none"
							/>
						</div>
					</div>
					<div>
						<label for="eabilities" class="mb-1 block text-sm font-semibold"
							>Abilities (optional)</label
						>
						<input
							id="eabilities"
							name="abilities"
							type="text"
							bind:value={enemyAbilities}
							placeholder="e.g., Pack Tactics, Nimble Escape"
							class="w-full rounded-sm border-2 border-border bg-bg-paper px-4 py-3 focus:border-[var(--accent)] focus:outline-none"
						/>
					</div>
					<div class="flex gap-3">
						<button
							type="submit"
							class="cursor-pointer rounded-pill border-none px-6 py-2.5 font-ui text-sm font-semibold uppercase tracking-wider text-bg-paper"
							style="background: var(--accent);"
						>
							{editingEnemy ? 'Save Changes' : 'Add Enemy'}
						</button>
						<button
							type="button"
							onclick={resetEnemyForm}
							class="cursor-pointer rounded-pill border-2 border-border bg-transparent px-6 py-2.5 font-ui text-sm font-semibold uppercase tracking-wider text-text-heading hover:border-[var(--accent)]"
						>
							Cancel
						</button>
					</div>
				</form>
			</div>
		{/if}

		{#if enemies.length === 0 && !showEnemyForm}
			<div
				class="rounded-md border-2 border-border bg-bg-card p-8 text-center"
				style="box-shadow: var(--shadow-sm);"
			>
				<p class="text-text-muted">No custom enemies yet</p>
			</div>
		{:else}
			<div class="flex flex-col gap-3">
				{#each enemies as enemy (enemy.id)}
					<div
						class="rounded-md border-2 border-border bg-bg-card p-5 transition-all duration-200 hover:-translate-y-0.5"
						style="box-shadow: var(--shadow-sm);"
					>
						<div class="flex items-center justify-between gap-4">
							<div>
								<div class="font-display text-xl font-bold text-text-heading">
									{enemy.name}
								</div>
								<div class="flex gap-4 text-sm text-text-muted">
									<span>HP {enemy.maxHp}</span>
									<span>AC {enemy.ac}</span>
									{#if enemy.abilities}
										<span>{enemy.abilities}</span>
									{/if}
								</div>
							</div>
							<div class="flex gap-2">
								<button
									onclick={() => editEnemy(enemy)}
									class="cursor-pointer rounded-sm border border-border bg-bg-paper px-3 py-2 text-sm font-semibold hover:border-[var(--accent)] hover:text-[var(--accent)]"
								>
									Edit
								</button>
								<form method="POST" action="?/deleteEnemy" use:enhance>
									<input type="hidden" name="id" value={enemy.id} />
									<button
										type="submit"
										class="cursor-pointer rounded-sm border border-border bg-bg-paper px-3 py-2 text-sm font-semibold text-red-500 hover:border-red-500 hover:bg-red-50"
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

	<!-- Encounter Templates Section -->
	<div>
		<div class="mb-4 flex items-center justify-between">
			<h2 class="font-display text-xl font-bold text-text-heading">Encounter Templates</h2>
			{#if !showEncounterForm && enemies.length > 0}
				<button
					onclick={() => (showEncounterForm = true)}
					class="cursor-pointer rounded-pill border-none px-5 py-2 font-ui text-sm font-semibold uppercase tracking-wider text-bg-paper"
					style="background: var(--accent);"
				>
					+ New Encounter
				</button>
			{/if}
		</div>

		{#if showEncounterForm}
			<div
				class="mb-6 rounded-md border-2 border-border bg-bg-card p-6"
				style="box-shadow: var(--shadow-sm);"
			>
				<form
					method="POST"
					action="?/saveEncounter"
					use:enhance={({ formData }) => {
						formData.set('id', editingEncounter?.id ?? crypto.randomUUID());
						formData.set('name', encounterName);
						formData.set('notes', encounterNotes);
						formData.set('entries', JSON.stringify(encounterEntries));
						return async ({ update }) => {
							await update();
							resetEncounterForm();
						};
					}}
					class="flex flex-col gap-4"
				>
					<div>
						<label for="encname" class="mb-1 block text-sm font-semibold">Encounter Name</label>
						<input
							id="encname"
							type="text"
							bind:value={encounterName}
							placeholder="e.g., Goblin Ambush"
							class="w-full rounded-sm border-2 border-border bg-bg-paper px-4 py-3 focus:border-[var(--accent)] focus:outline-none"
							autofocus
						/>
					</div>
					<div>
						<label for="encnotes" class="mb-1 block text-sm font-semibold"
							>Notes (optional)</label
						>
						<textarea
							id="encnotes"
							bind:value={encounterNotes}
							placeholder="e.g., Bugbear hiding behind rocks, surprise round"
							rows="2"
							class="w-full rounded-sm border-2 border-border bg-bg-paper px-4 py-3 focus:border-[var(--accent)] focus:outline-none"
						></textarea>
					</div>

					<div>
						<label class="mb-2 block text-sm font-semibold">Enemies in this encounter</label>
						{#if encounterEntries.length > 0}
							<div class="mb-3 flex flex-col gap-2">
								{#each encounterEntries as entry}
									<div
										class="flex items-center justify-between rounded-sm border border-border/50 bg-bg-paper px-4 py-2"
									>
										<span class="font-semibold">{getEnemyName(entry.enemyId)}</span>
										<div class="flex items-center gap-3">
											<button
												type="button"
												onclick={() => {
													entry.quantity = Math.max(1, entry.quantity - 1);
													encounterEntries = [...encounterEntries];
												}}
												class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-border bg-bg-paper text-lg hover:border-[var(--accent)]"
											>
												&minus;
											</button>
											<span class="min-w-[20px] text-center font-semibold"
												>{entry.quantity}</span
											>
											<button
												type="button"
												onclick={() => {
													entry.quantity++;
													encounterEntries = [...encounterEntries];
												}}
												class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-border bg-bg-paper text-lg hover:border-[var(--accent)]"
											>
												+
											</button>
											<button
												type="button"
												onclick={() => removeEntryFromEncounter(entry.enemyId)}
												class="ml-2 cursor-pointer border-none bg-transparent text-red-400 hover:text-red-600"
											>
												&times;
											</button>
										</div>
									</div>
								{/each}
							</div>
						{/if}
						<div class="flex flex-wrap gap-2">
							{#each enemies as enemy}
								<button
									type="button"
									onclick={() => addEntryToEncounter(enemy.id)}
									class="cursor-pointer rounded-pill border border-border bg-bg-paper px-3 py-1.5 text-sm font-semibold hover:border-[var(--accent)] hover:text-[var(--accent)]"
								>
									+ {enemy.name}
								</button>
							{/each}
						</div>
					</div>

					<div class="flex gap-3">
						<button
							type="submit"
							class="cursor-pointer rounded-pill border-none px-6 py-2.5 font-ui text-sm font-semibold uppercase tracking-wider text-bg-paper"
							style="background: var(--accent);"
						>
							{editingEncounter ? 'Save Changes' : 'Create Encounter'}
						</button>
						<button
							type="button"
							onclick={resetEncounterForm}
							class="cursor-pointer rounded-pill border-2 border-border bg-transparent px-6 py-2.5 font-ui text-sm font-semibold uppercase tracking-wider text-text-heading hover:border-[var(--accent)]"
						>
							Cancel
						</button>
					</div>
				</form>
			</div>
		{/if}

		{#if encounters.length === 0 && !showEncounterForm}
			<div
				class="rounded-md border-2 border-border bg-bg-card p-8 text-center"
				style="box-shadow: var(--shadow-sm);"
			>
				<p class="text-text-muted">
					{enemies.length === 0
						? 'Add some enemies first, then create encounter templates'
						: 'No encounters yet. Create one to speed up combat setup!'}
				</p>
			</div>
		{:else}
			<div class="flex flex-col gap-3">
				{#each encounters as encounter (encounter.id)}
					<div
						class="rounded-md border-2 border-border bg-bg-card p-5 transition-all duration-200 hover:-translate-y-0.5"
						style="box-shadow: var(--shadow-sm);"
					>
						<div class="flex items-center justify-between gap-4">
							<div>
								<div class="font-display text-xl font-bold text-text-heading">
									{encounter.name}
								</div>
								<div class="text-sm text-text-muted">
									{encounter.entries
										.map((e) => `${getEnemyName(e.enemyId)} x${e.quantity}`)
										.join(', ')}
								</div>
								{#if encounter.notes}
									<div class="mt-1 text-sm text-text-muted italic">{encounter.notes}</div>
								{/if}
							</div>
							<div class="flex gap-2">
								<button
									onclick={() => editEncounter(encounter)}
									class="cursor-pointer rounded-sm border border-border bg-bg-paper px-3 py-2 text-sm font-semibold hover:border-[var(--accent)] hover:text-[var(--accent)]"
								>
									Edit
								</button>
								<form method="POST" action="?/deleteEncounter" use:enhance>
									<input type="hidden" name="id" value={encounter.id} />
									<button
										type="submit"
										class="cursor-pointer rounded-sm border border-border bg-bg-paper px-3 py-2 text-sm font-semibold text-red-500 hover:border-red-500 hover:bg-red-50"
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
</div>
