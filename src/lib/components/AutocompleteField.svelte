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

	let activeIndex = $state(0);
	let tabQuery = $state('');
	let inputEl = $state<HTMLInputElement | null>(null);
	const recommendationSlots = [0, 1, 2, 3];

	function normalize(text: string) {
		return text.trim().toLowerCase();
	}

	function optionMatches(option: AutocompleteOption, query: string) {
		const normalizedQuery = normalize(query);
		if (!normalizedQuery) return true;
		return option.label.toLowerCase().includes(normalizedQuery);
	}

	function matchingOptions(query: string) {
		return options.filter((option) => optionMatches(option, query));
	}

	function completionOption(query: string) {
		const normalizedQuery = normalize(query);
		if (!normalizedQuery) return undefined;
		return matchingOptions(query).find((option) => {
			const label = option.label.toLowerCase();
			return label.startsWith(normalizedQuery) && label.length > normalizedQuery.length;
		});
	}

	const recommendationQuery = $derived(tabQuery || value);
	const hasRecommendationQuery = $derived(normalize(recommendationQuery).length > 0);
	const hasExactValue = $derived(
		options.some((option) => option.label.toLowerCase() === value.trim().toLowerCase())
	);
	const filteredOptions = $derived(
		hasRecommendationQuery && (Boolean(tabQuery) || !hasExactValue)
			? matchingOptions(recommendationQuery).slice(0, 4)
			: []
	);
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
		tabQuery = '';
		onInput?.(nextValue);
	}

	function chooseOption(option: AutocompleteOption) {
		value = option.label;
		onSelect?.(option);
		inputEl?.focus();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (disabled) return;

		if (event.key === 'Tab' && filteredOptions.length > 0) {
			event.preventDefault();
			if (!tabQuery) {
				tabQuery = value;
			}
			chooseOption(filteredOptions[activeIndex]);
			activeIndex = (activeIndex + 1) % filteredOptions.length;
			return;
		}

		if (event.key === 'ArrowDown') {
			event.preventDefault();
			activeIndex = filteredOptions.length === 0 ? 0 : (activeIndex + 1) % filteredOptions.length;
			return;
		}

		if (event.key === 'ArrowUp') {
			event.preventDefault();
			activeIndex =
				filteredOptions.length === 0
					? 0
					: (activeIndex - 1 + filteredOptions.length) % filteredOptions.length;
			return;
		}

		if (event.key === 'Enter' && filteredOptions[activeIndex]) {
			event.preventDefault();
			chooseOption(filteredOptions[activeIndex]);
			return;
		}

		if (event.key === 'Escape') {
			tabQuery = '';
			activeIndex = 0;
		}
	}

	function focusInput() {
		if (disabled) return;
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
				aria-expanded={filteredOptions.length > 0}
				aria-controls={`${id}-options`}
				aria-autocomplete="list"
				class="relative z-10 min-h-14 w-full bg-transparent px-4 text-lg font-semibold text-text-heading placeholder:text-text-muted focus:outline-none disabled:cursor-not-allowed"
				oninput={(event) => updateValue(event.currentTarget.value)}
				onkeydown={handleKeydown}
			/>
		</div>

		<button
			type="button"
			class="flex w-16 shrink-0 cursor-pointer items-center justify-center border-l-2 border-border bg-bg-card text-text-heading transition-colors hover:bg-bg-surface disabled:cursor-not-allowed"
			disabled={disabled}
			aria-label="Show choices"
			aria-expanded={filteredOptions.length > 0}
			onmousedown={(event) => event.preventDefault()}
			onclick={focusInput}
		>
			<span class="h-3 w-3 rotate-45 border-r-2 border-b-2 border-current" aria-hidden="true"></span>
		</button>
	</div>

	<div
		id={`${id}-options`}
		role="listbox"
		class="mt-2 h-[184px] overflow-hidden rounded-sm border border-border/40 bg-bg-paper/35 py-1"
	>
		{#each recommendationSlots as slot}
			{@const option = filteredOptions[slot]}
			{#if option}
				<button
					type="button"
					role="option"
					aria-selected={slot === activeIndex}
					class="block h-11 w-full cursor-pointer border-none bg-transparent px-4 text-left text-lg font-semibold text-text-heading transition-colors hover:bg-bg-card"
					class:bg-bg-card={slot === activeIndex}
					disabled={disabled}
					onmousedown={(event) => event.preventDefault()}
					onclick={() => chooseOption(option)}
				>
					{option.label}
				</button>
			{:else if slot === 0 && filteredOptions.length === 0}
				<div class="h-11" aria-hidden="true"></div>
			{:else}
				<div class="h-11" aria-hidden="true"></div>
			{/if}
		{/each}
	</div>
</div>
