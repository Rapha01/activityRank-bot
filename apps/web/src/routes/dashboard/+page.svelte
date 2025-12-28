<script lang="ts">
  import CloudAlertIcon from '@lucide/svelte/icons/cloud-alert';
  import ConstructionIcon from '@lucide/svelte/icons/construction';
  import { getUserAvatarUrl } from '$lib/util';
  import Nav from '../../components/Nav.svelte';
  import type { PageProps } from './$types';
  import GuildEntry from './GuildEntry.svelte';

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
  <div class="border border-orange-700 dark:border-orange-300 bg-orange-500/10 rounded-md flex flex-col md:flex-row justify-center items-center px-4 md:px-6 py-2 md:py-6 gap-2 md:gap-8">
    <ConstructionIcon class="size-12 text-orange-700 dark:text-orange-300" />
    <div class="flex flex-col">
      <h1 class="font-bold text-xl pb-2 text-center md:text-start">Under Construction</h1>
      <p>
        This site is still a work in progress. Thank you for testing it!
      </p>
      <p>
        If you encounter any issues, please report them on our
        <a href="/support" class="bg-linear-to-br from-theme-700 to-theme-800 dark:from-theme-200 dark:to-theme-400 bg-clip-text text-transparent">support server</a>.
      </p>
    </div>
  </div>
  {#if data.hasAccess}
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
  {:else}
    <div class="border border-orange-700 dark:border-orange-300 bg-orange-500/10 rounded-md flex flex-col md:flex-row justify-center items-center px-4 md:px-6 py-2 md:py-6 gap-2 md:gap-8">
      <ConstructionIcon class="size-12 text-orange-700 dark:text-orange-300" />
      <div class="flex flex-col">
        <h1 class="font-bold text-xl pb-2 text-center md:text-start">Under Construction</h1>
        <p>
          The dashboard is still being built. 
          Currently, only bot administrators have access to test the dashboard.
        </p>
        <p>
          If you would like to become a tester, join our 
          <a href="/support" class="bg-linear-to-br from-theme-700 to-theme-800 dark:from-theme-200 dark:to-theme-400 bg-clip-text text-transparent">support server</a>
          and send a direct message to <code class="font-mono text-theme-700 dark:text-theme-400/90">@piemot</code> requesting access.
        </p>
      </div>
    </div>
  {/if}
</div>
