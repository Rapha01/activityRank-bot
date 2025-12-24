<script lang="ts">
	import type { PageProps } from './$types';

	import Sidebar from './Sidebar.svelte';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';

	import { getGuildIconUrl, getUserAvatarUrl } from '$lib/util';
	import Switch from '../../../components/Switch.svelte';
	import PermissionIcon from '../permissisons/PermissionIcon.svelte';
	import { namePermission } from '../permissisons/permissions';

	let { data }: PageProps = $props();
</script>

<div class="flex min-h-dvh w-full">
	<Sidebar desktopOpen={true} mobileOpen={false}>
		<button class="group flex items-center justify-between px-3 py-4 hover:bg-slate-200/50 hover:dark:bg-slate-800/50">
			<div class="flex gap-3 items-center">
				<span
					class="flex size-9 items-center justify-center rounded-md bg-white p-1.5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"
				>
					<img src={getGuildIconUrl(data.guild)} alt="" class="size-6" />
				</span>
				<div>
					<span class="block truncate font-semibold text-slate-900 dark:text-slate-50">
						{data.guild.name}
					</span>
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
					<!-- <a href="" data-active class={[ -->
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
					<span>@{data.user.username}</span>
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
		<div class="w-full px-16 pt-16">
			<div class="rounded-xl flex items-center gap-4 p-4 bg-theme-400/20 border-2 border-theme-400/50 w-full">
				<span
					class="flex size-16 items-center justify-center rounded-md bg-white p-2 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"
				>
					<img src={getGuildIconUrl(data.guild)} alt="" class="max-size-14 size-full" />
				</span> 
				<div class="space-y-1">
					<span class="uppercase font-semibold text-slate-500 text-sm font-mono flex gap-1">
						<PermissionIcon class="size-5" permission={data.permissionLevel} /> {namePermission(data.permissionLevel)}
					</span>
					<h1 class="text-2xl text-slate-200 font-semibold">{data.guild.name}</h1> 
				</div>
			</div>
		</div>
		<main class="w-full px-16 pt-16 text-slate-900 dark:text-slate-200">
			<Switch labelText="Toggle me!" />
		</main>
	</div>
</div>
