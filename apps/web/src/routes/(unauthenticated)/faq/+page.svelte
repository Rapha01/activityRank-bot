<script lang="ts">
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import { Accordion } from 'bits-ui';
  import Head from '../../../components/Head.svelte';
  import type { PageProps } from './$types';

  const props: PageProps = $props();
</script>

<Head
  title="Frequently Asked Questions"
  description="Find answers to common questions about ActivityRank. Learn how to set up leveling, configure custom rewards, and troubleshoot activity tracking on your Discord server."
/>

<main class="max-w-3xl w-full px-4 py-8 text-slate-800 dark:text-slate-200">
	<h1 class="text-4xl/snug font-bold mb-8">Frequently Asked Questions</h1>
	<Accordion.Root class="w-full" type="multiple">
		{#each props.data.faqs as entry (entry.id)}
			<Accordion.Item
				value={entry.id.toString()}
				class="group border-b border-slate-500/20 px-1.5"
			>
				<Accordion.Header>
					<Accordion.Trigger
						class="flex w-full flex-1 select-none items-center justify-between py-5 font-medium transition-all [&[data-state=open]>span>svg]:rotate-180"
					>
						<span class="w-full text-left">
							{entry.title}
						</span>
						<span
							class="hover:bg-slate-500/20 inline-flex size-8 items-center justify-center rounded-md"
						>
							<ChevronDownIcon class="size-7 transition-transform duration-200" />
						</span>
					</Accordion.Trigger>
				</Accordion.Header>
				<Accordion.Content
					class="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden text-sm tracking-[-0.01em]"
				>
					<div class="pb-6">
						{@html entry.desc}
					</div>
				</Accordion.Content>
			</Accordion.Item>
		{/each}
	</Accordion.Root>
</main>
