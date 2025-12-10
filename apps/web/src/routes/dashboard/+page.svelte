<script lang="ts">
	import { getUserAvatarUrl } from '$lib/util';
	import type { PageProps } from './$types';
	import CloudAlertIcon from '@lucide/svelte/icons/cloud-alert';
	import GuildEntry from './GuildEntry.svelte';
	import Nav from '../../components/Nav.svelte';

	let { data }: PageProps = $props();
</script>

<Nav user={data.user} />
<div class="py-8 px-8 md:px-48 grid space-y-8 text-slate-800 dark:text-slate-200">
	<h1 class="flex items-center gap-6 text-2xl font-bold">
		<img
			class="size-12 rounded-md"
			src={getUserAvatarUrl(data.user)}
			alt="profile"
		/>
		Hi, @{data.user.username}!
	</h1>
	{#if !data.listIsComplete}
		<div class="border border-red-700 dark:border-red-300 bg-red-500/10 rounded-md flex items-center px-4 py-2 gap-4">
			<CloudAlertIcon class="size-8 text-red-700 dark:text-red-300" />
			<div class="flex flex-col">
				<span class="font-bold">Failed to load servers.</span>
				<span>Some servers may be missing from this list.</span>
			</div>
		</div>
	{/if}
	<ul class="grid grid-cols-1 md:grid-cols-3 gap-4">
		{#each data.sharedGuilds as guild}
			<GuildEntry bot={true} {...guild} />
		{/each}
		{#each data.unsharedGuilds as guild}
			<GuildEntry bot={false} {...guild} />
		{/each}
	</ul>
</div>
