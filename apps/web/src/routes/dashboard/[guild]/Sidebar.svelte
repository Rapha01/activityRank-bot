<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Dialog } from 'bits-ui';
	import XIcon from '@lucide/svelte/icons/x';

	interface Props {
		desktopOpen: boolean;
		mobileOpen: boolean;
		children: Snippet;
	}
	let { children, desktopOpen, mobileOpen }: Props = $props();
</script>

<Dialog.Root bind:open={mobileOpen}>
	<Dialog.Portal>
		<Dialog.Overlay
			data-open={mobileOpen ? '' : null}
			data-closed={!mobileOpen ? '' : null}
			class={[
                "data-closed:animate-out data-closed:fade-out-0",
                "data-open:animate-in data-open:fade-in-0",
                "fixed inset-0 z-50 bg-black/20 dark:bg-black/80"
                ]}
		></Dialog.Overlay>
		<Dialog.Content class="bg-emerald-300/40">
			<Dialog.Title>Sidebar</Dialog.Title>
			<div class="relative flex h-full w-full flex-col">
				<Dialog.Close
					class="absolute right-4 top-4 !p-2 text-slate-700 hover:text-slate-900 dark:text-slate-300 hover:dark:text-slate-50"
				>
					<XIcon class="size-5" />
				</Dialog.Close>
				{@render children()}
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
<div
	class="group/sidebar peer hidden md:block"
	data-open={desktopOpen ? '' : null}
	data-closed={!desktopOpen ? '' : null}
>
	<div
		class="group-data-closed/sidebar:w-0 relative h-svh w-64 bg-transparent transition-[width] duration-150 ease-in-out will-change-transform"
	></div>
	<div
		class={[
			'fixed inset-y-0 z-10 hidden h-svh w-64 transition-[left,right,width] duration-150 ease-in-out will-change-transform md:flex',
			'group-data-closed/sidebar:-left-64 left-0',
			'border-r border-slate-300 dark:border-slate-700',
		]}
	>
		<div data-sidebar="sidebar" class="bg-sidebar flex h-full w-full flex-col">
			{@render children()}
		</div>
	</div>
</div>
