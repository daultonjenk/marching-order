<script lang="ts">
	type AutocompleteOption = {
		id: string;
		label: string;
	};

	interface Props {
		id: string;
		label: string;
		options: AutocompleteOption[];
		value: string;
		placeholder?: string;
		disabled?: boolean;
		testId?: string;
		emptyText?: string;
		onInput?: (value: string) => void;
		onSelect?: (option: AutocompleteOption) => void;
	}

	let {
		id,
		label,
		options,
		value = $bindable(''),
		placeholder = 'Type a name here',
		disabled = false,
		testId,
		emptyText = 'No matches',
		onInput,
		onSelect
	}: Props = $props();

	let isOpen = $state(false);
	let activeIndex = $state(0);
	let inputEl = $state<HTMLInputElement | null>(null);

	function normalize(text: string) {
		return text.trim().toLowerCase();
	}

	function optionMatches(option: AutocompleteOption, query: string) {
		const normalizedQuery = normalize(query);
		if (!normalizedQuery) return true;
		return option.label.toLowerCase().includes(normalizedQuery);
	}

	function completionOption(query: string) {
		const normalizedQuery = normalize(query);
		if (!normalizedQuery) return undefined;
		return options.find((option) => {
			const label = option.label.toLowerCase();
			return label.startsWith(normalizedQuery) && label.length > normalizedQuery.length;
		});
	}

	const filteredOptions = $derived(options.filter((option) => optionMatches(option, value)).slice(0, 8));
	const suggestedOption = $derived(completionOption(value));
	const completionText = $derived(suggestedOption ? suggestedOption.label.slice(value.length) : '');

	$effect(() => {
		if (activeIndex >= filteredOptions.length) {
			activeIndex = 0;
		}
	});

	function updateValue(nextValue: string) {
		value = nextValue;
		activeIndex = 0;
		isOpen = true;
		onInput?.(nextValue);
	}

	function chooseOption(option: AutocompleteOption) {
		value = option.label;
		isOpen = false;
		onSelect?.(option);
		inputEl?.focus();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (disabled) return;

		if (event.key === 'Tab' && suggestedOption) {
			event.preventDefault();
			chooseOption(suggestedOption);
			return;
		}

		if (event.key === 'ArrowDown') {
			event.preventDefault();
			isOpen = true;
			activeIndex = filteredOptions.length === 0 ? 0 : (activeIndex + 1) % filteredOptions.length;
			return;
		}

		if (event.key === 'ArrowUp') {
			event.preventDefault();
			isOpen = true;
			activeIndex =
				filteredOptions.length === 0
					? 0
					: (activeIndex - 1 + filteredOptions.length) % filteredOptions.length;
			return;
		}

		if (event.key === 'Enter' && isOpen && filteredOptions[activeIndex]) {
			event.preventDefault();
			chooseOption(filteredOptions[activeIndex]);
			return;
		}

		if (event.key === 'Escape') {
			isOpen = false;
		}
	}

	function toggleOptions() {
		if (disabled) return;
		isOpen = !isOpen;
		inputEl?.focus();
	}
</script>

<div class="relative">
	<label class="sr-only" for={id}>{label}</label>
	<div
		class="flex min-h-14 overflow-hidden rounded-sm border-2 border-border bg-bg-paper focus-within:border-[var(--accent)]"
		class:opacity-45={disabled}
	>
		<div class="relative min-w-0 flex-1">
			{#if completionText}
				<div
					class="pointer-events-none absolute inset-0 flex items-center overflow-hidden px-4 text-lg font-semibold whitespace-pre text-text-muted/55"
					aria-hidden="true"
				>
					<span class="invisible">{value}</span><span>{completionText}</span>
				</div>
			{/if}
			<input
				bind:this={inputEl}
				{id}
				data-testid={testId}
				type="text"
				value={value}
				{placeholder}
				disabled={disabled}
				autocomplete="off"
				role="combobox"
				aria-label={label}
				aria-expanded={isOpen}
				aria-controls={`${id}-options`}
				aria-autocomplete="list"
				class="relative z-10 min-h-14 w-full bg-transparent px-4 text-lg font-semibold text-text-heading placeholder:text-text-muted focus:outline-none disabled:cursor-not-allowed"
				onfocus={() => (isOpen = true)}
				oninput={(event) => updateValue(event.currentTarget.value)}
				onkeydown={handleKeydown}
				onblur={() => {
					window.setTimeout(() => (isOpen = false), 120);
				}}
			/>
		</div>

		<button
			type="button"
			class="flex w-16 shrink-0 cursor-pointer items-center justify-center border-l-2 border-border bg-bg-card text-text-heading transition-colors hover:bg-bg-surface disabled:cursor-not-allowed"
			disabled={disabled}
			aria-label="Show choices"
			aria-expanded={isOpen}
			onmousedown={(event) => event.preventDefault()}
			onclick={toggleOptions}
		>
			<span class="h-3 w-3 rotate-45 border-r-2 border-b-2 border-current" aria-hidden="true"></span>
		</button>
	</div>

	{#if isOpen && !disabled}
		<div
			id={`${id}-options`}
			role="listbox"
			class="mt-1 max-h-56 overflow-y-auto rounded-sm border-2 border-border bg-bg-card py-1"
			style="box-shadow: var(--shadow-md);"
		>
			{#if filteredOptions.length > 0}
				{#each filteredOptions as option, index (option.id)}
					<button
						type="button"
						role="option"
						aria-selected={index === activeIndex}
						class="block min-h-11 w-full cursor-pointer border-none px-4 py-2 text-left text-lg font-semibold text-text-heading transition-colors hover:bg-bg-paper"
						class:bg-bg-paper={index === activeIndex}
						onmousedown={(event) => event.preventDefault()}
						onclick={() => chooseOption(option)}
					>
						{option.label}
					</button>
				{/each}
			{:else}
				<div class="px-4 py-3 text-sm text-text-muted">{emptyText}</div>
			{/if}
		</div>
	{/if}
</div>
