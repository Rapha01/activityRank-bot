<script lang="ts">
	import type { PageProps } from './$types';

	import Sidebar from './Sidebar.svelte';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';

	import arLogo from '$lib/assets/favicon.svg';
	import { getUserAvatarUrl } from '$lib/util';

	let { data }: PageProps = $props();
</script>

<div class="flex min-h-dvh w-full">
	<Sidebar desktopOpen={true} mobileOpen={false}>
		<button class="group flex items-center justify-between px-3 py-4 hover:bg-slate-200/50 hover:dark:bg-slate-800/50">
			<div class="flex gap-3 items-center">
				<span
					class="flex size-9 items-center justify-center rounded-md bg-white p-1.5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"
				>
					<img src={arLogo} alt="" class="size-6" />
				</span>
				<div>
					<span class="block text-sm font-semibold text-slate-900 dark:text-slate-50">
						ActivityRank
					</span>
					<span class="block text-xs text-slate-900 dark:text-slate-50"> Support Server </span>
				</div>
			</div>
			<ChevronDownIcon
				class="size-4 text-gray-500 group-hover:text-gray-700 group-hover:dark:text-gray-400"
				aria-hidden="true"
			/>
		</button>
		<div class="border-t border-slate-300 dark:border-slate-700"></div>	
		<div class="flex min-h-0 flex-1 flex-col gap-2 overflow-auto">
			<ul class="flex flex-col gap-1 p-3">
				<li>
					<a href="" class={[
						"flex gap-2 items-center rounded-md p-2 text-base transitio hover:bg-slate-200/50 sm:text-sm hover:dark:bg-slate-800",
						"text-gray-900 dark:text-gray-400 hover:dark:text-gray-50",
						"data-active:text-teal-600 data-active:dark:text-teal-400",
					]}>
						<ChevronsUpDownIcon
							class="size-4"
							aria-hidden="true"
						/>
						Home
					</a>
				</li>
				<li>
					<a href="" class={[
						"flex gap-2 items-center rounded-md p-2 text-base transitio hover:bg-slate-200/50 sm:text-sm hover:dark:bg-slate-800",
						"text-gray-900 dark:text-gray-400 hover:dark:text-gray-50",
						"data-active:text-teal-600 data-active:dark:text-teal-400",
					]}>
						<ChevronsUpDownIcon
							class="size-4"
							aria-hidden="true"
						/>
						Home
					</a>
				</li>
				<li>
					<a href="" class={[
						"flex gap-2 items-center rounded-md p-2 text-base transitio hover:bg-slate-200/50 sm:text-sm hover:dark:bg-slate-800",
						"text-gray-900 dark:text-gray-400 hover:dark:text-gray-50",
						"data-active:text-teal-600 data-active:dark:text-teal-400",
					]}>
						<ChevronsUpDownIcon
							class="size-4"
							aria-hidden="true"
						/>
						Home
					</a>
				</li>
				<li>
					<a href="" class={[
						"flex gap-2 items-center rounded-md p-2 text-base transitio hover:bg-slate-200/50 sm:text-sm hover:dark:bg-slate-800",
						"text-gray-900 dark:text-gray-400 hover:dark:text-gray-50",
						"data-active:text-teal-600 data-active:dark:text-teal-400",
					]}>
						<ChevronsUpDownIcon
							class="size-4"
							aria-hidden="true"
						/>
						Home
					</a>
				</li>
				<li>
					<a href="" data-active class={[
						"flex gap-2 items-center rounded-md p-2 text-base transitio hover:bg-slate-200/50 sm:text-sm hover:dark:bg-slate-800",
						"text-gray-900 dark:text-gray-400 hover:dark:text-gray-50",
						"data-active:text-teal-600 data-active:dark:text-teal-400",
					]}>
						<ChevronsUpDownIcon
							class="size-4"
							aria-hidden="true"
						/>
						Home
					</a>
				</li>
				<li>
					<a href="" class={[
						"flex gap-2 items-center rounded-md p-2 text-base transitio hover:bg-slate-200/50 sm:text-sm hover:dark:bg-slate-800",
						"text-gray-900 dark:text-gray-400 hover:dark:text-gray-50",
						"data-active:text-teal-600 data-active:dark:text-teal-400",
					]}>
						<ChevronsUpDownIcon
							class="size-4"
							aria-hidden="true"
						/>
						Home
					</a>
				</li>
			</ul>
		</div>
		<div class="flex flex-col gap-2 p-3">
			<div class="border-t border-slate-300 dark:border-slate-700"></div>	
			<button
				aria-label="User settings"
				class="group flex w-full items-center justify-between rounded-md px-1 py-2 text-sm font-medium text-slate-900 dark:text-slate-100 hover:bg-slate-200/50 hover:dark:bg-slate-800/50"
			>
				<span class="flex items-center gap-3">
					<img src={getUserAvatarUrl(data.user)} alt="" class="flex size-8 shrink-0 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300" />
					<span>@piemot</span>
				</span>
				<ChevronsUpDownIcon
					class="size-4 text-gray-500 group-hover:text-gray-700 group-hover:dark:text-gray-400"
					aria-hidden="true"
				/>
			</button>
		</div>
	</Sidebar>
	<div class="w-full">
		<!-- main body -->
	</div>
</div>
