<script lang="ts">
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import { Accordion } from 'bits-ui';
  import type { PageProps } from './$types';

  const props: PageProps = $props();
</script>

<main class="max-w-3xl w-full px-4 py-8 text-slate-800 dark:text-slate-200">
	<h1 class="text-4xl/snug font-extrabold">Patchnotes</h1>
	<Accordion.Root class="w-full" type="multiple">
		{#each props.data.patchnotes as entry (entry.version)}
			<Accordion.Item
				value={entry.version}
				class="group border-b border-slate-500/20 px-1.5"
			>
				<Accordion.Header>
					<Accordion.Trigger
						class="flex w-full flex-1 select-none items-center justify-between py-5 font-medium transition-all [&[data-state=open]>span>svg]:rotate-180"
					>
						<div class="w-full flex flex-col items-start text-start">
							<span class="text-xl"><span class="text-theme-700">{entry.version}</span> • {entry.title}</span>
							<span class="pr-4">{entry.desc}</span>
						</div>
						<span
							class="hover:bg-slate-500/20 inline-flex size-8 items-center justify-center rounded-md"
						>
							<ChevronDownIcon class="size-7 transition-transform duration-200" />
						</span>
					</Accordion.Trigger>
				</Accordion.Header>
				<Accordion.Content
					class="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden tracking-[-0.01em]"
				>
					<div class="pb-6">
						{#if entry.features.length > 0}
						<div class="font-bold text-theme-700 dark:text-theme-400/80 text-xl">Features</div>
							{#each entry.features as feature} 
								<div class="pl-4 py-1 flex flex-col">	
									<span class="font-bold">{feature.title}</span>
									<span class="pl-4">{feature.desc}</span>
								</div>
							{/each}
						{/if}
						{#if entry.fixes.length > 0}
							<div class="mt-4 font-bold text-theme-700 dark:text-theme-400/80 text-xl">Bug Fixes</div>
							{#each entry.fixes as fix} 
								<div class="pl-4 py-1 flex flex-col">	
									<span class="font-bold">{fix.title}</span>
									<span class="pl-4">{fix.desc}</span>
								</div>
							{/each}
						{/if}
					</div>
				</Accordion.Content>
			</Accordion.Item>
		{/each}
	</Accordion.Root>
</main>
