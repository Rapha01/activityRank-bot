<script lang="ts">
	import type { PageProps } from './$types';

	import Sidebar from './Sidebar.svelte';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import PanelLeftIcon from '@lucide/svelte/icons/panel-left';

	import { getGuildIconUrl, getUserAvatarUrl } from '$lib/util';
	import Switch from '../../../components/Switch.svelte';
	import PermissionIcon from '../permissisons/PermissionIcon.svelte';
	import { namePermission } from '../permissisons/permissions';
	import { DropdownMenu } from 'bits-ui';
	import { ThemeManager } from '$lib/themes.svelte';
	import ThemeSwitcher from './ThemeSwitcher.svelte';

	const loadManager = async () => ThemeManager.getInstance();

	let { data }: PageProps = $props();

	let sidebarOpen = $state(true)
	function toggleSidebar() {
		sidebarOpen = !sidebarOpen;
	}
</script>

<div class="flex min-h-dvh w-full">
	<Sidebar bind:open={sidebarOpen}>
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
				class="size-4 text-gray-500 group-hover:text-gray-700 group-hover:dark:text-gray-400 mr-12 md:mr-0"
				aria-hidden="true"
			/>
		</button>
		<!-- <div class="border-t border-slate-300 dark:border-slate-700"></div>	 -->
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
			</ul>
		</div>
		<div class="flex flex-col gap-2 p-3">
			<div class="border-t border-slate-300 dark:border-slate-700"></div>	
			<DropdownMenu.Root>
				<DropdownMenu.Trigger
					aria-label="User settings"
					class="group flex w-full items-center justify-between rounded-md px-1 py-2 text-sm font-medium text-slate-900 dark:text-slate-100 hover:bg-slate-200/50 hover:dark:bg-slate-800/50"
				>
					<span class="flex items-center gap-3">
						<img src={getUserAvatarUrl(data.user)} alt="" class="flex size-8 shrink-0 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300" />
						<span>@{data.user.username}</span>
					</span>
					<ChevronsUpDownIcon
						class="size-4 text-slate-500 group-hover:text-slate-700 group-hover:dark:text-slate-400"
						aria-hidden="true"
					/>
				</DropdownMenu.Trigger>
				<DropdownMenu.Portal>
					<DropdownMenu.Content align="start" class={[
						"relative z-50 rounded-md border p-1 shadow-xl min-w-48 pointer-events-auto",
						"bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50 border-slate-200 dark:border-slate-800",
						"will-change-[opacity] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in data-[state=closed]:fade-out duration-250",
					]}>
						<DropdownMenu.Item>
							{#snippet child({ props })}
								<h3 {...props} class="px-2 py-2 text-xs font-mono font-medium tracking-wide text-slate-500 dark:text-slate-500">
									@{data.user.username}
								</h3>
							{/snippet}
						</DropdownMenu.Item>
						<DropdownMenu.Group>
							<DropdownMenu.Sub>
								<DropdownMenu.SubTrigger class={[
									"relative flex cursor-default select-none items-center rounded py-1.5 pl-2 pr-1 outline-none transition-colors data-[state=checked]:font-semibold sm:text-sm",
									// text color
									"text-gray-900 dark:text-gray-50",
									// focus
									"focus-visible:bg-gray-100 data-[state=open]:bg-gray-100 focus-visible:dark:bg-gray-900 data-[state=open]:dark:bg-gray-900",
									// hover
									"hover:bg-gray-100 hover:dark:bg-gray-900"
								]}>
									Theme
									<ChevronRightIcon class="ml-auto size-5" />
								</DropdownMenu.SubTrigger>
								{#await loadManager() then manager}	
									<ThemeSwitcher themeManager={manager} />
								{/await}
							</DropdownMenu.Sub>
						</DropdownMenu.Group>
						<DropdownMenu.Separator class="-mx-1 my-1 h-px border-t border-slate-200 dark:border-slate-800"/>
						<DropdownMenu.Item>
							{#snippet child({ props })}
								<form {...props} method="POST" action="?/signout">
									<button type="submit" class={[
										"w-full relative flex cursor-pointer select-none items-center rounded py-1.5 pl-2 pr-1 outline-none transition-colors data-[state=checked]:font-semibold sm:text-sm",
										// text color
										"text-slate-900 dark:text-slate-50",
										// focus / hover
										"focus-visible:bg-red-100/50 focus-visible:dark:bg-red-900/40 hover:bg-red-100/50 hover:dark:bg-red-900/40"
									]}>
										Sign Out
									</button>
								</form>
							{/snippet}
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Portal>
			</DropdownMenu.Root>
		</div>
	</Sidebar>
	<div class="w-full">
		<header class="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900">
			<button
				class="-ml-1 group inline-flex rounded-md p-1.5 hover:bg-slate-200/50 hover:dark:bg-slate-200/10"
				onclick={toggleSidebar}
			>
				<PanelLeftIcon
					class="size-4.5 shrink-0 text-slate-700 dark:text-slate-300"
					aria-hidden="true"
				/>
				<span class="sr-only">Toggle Sidebar</span>
			</button>
			<div class="mr-2 h-4 w-px bg-slate-200 dark:bg-slate-700"></div>
			<img src={getGuildIconUrl(data.guild)} alt="" class="size-8" />
			<h1 class="text-slate-700 dark:text-slate-200 font-semibold">{data.guild.name}</h1> 
		</header>
		<!-- main body -->
		<div class="w-full px-16 pt-16">
			<div class="rounded-xl flex items-center gap-4 p-4 bg-theme-400/20 border-2 border-theme-400/50 w-full">
				<span
					class="flex size-16 items-center justify-center rounded-md bg-white p-2 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"
				>
					<img src={getGuildIconUrl(data.guild)} alt="" class="max-size-14 size-full" />
				</span> 
				<div class="space-y-1">
					<span class="uppercase font-semibold text-slate-400 dark:text-slate-500 text-sm font-mono flex gap-1">
						<PermissionIcon class="size-5" permission={data.permissionLevel} /> {namePermission(data.permissionLevel)}
					</span>
					<h1 class="text-2xl text-slate-700 dark:text-slate-200 font-semibold">{data.guild.name}</h1> 
				</div>
			</div>
		</div>
		<main class="w-full px-16 pt-16 text-slate-900 dark:text-slate-200">
			<Switch labelText="Toggle me!" />
		</main>
	</div>
</div>
