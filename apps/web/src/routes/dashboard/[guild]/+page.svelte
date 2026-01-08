<script lang="ts">
  import { nameApiPermission } from '$lib/api/permissions';
  import { getGuildIconUrl } from '$lib/util';
  import PermissionIcon from '../PermissionIcon.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
</script>

<div class="w-full">
  <div class="rounded-xl flex items-center gap-4 p-4 bg-theme-400/20 border-2 border-theme-400/50 w-full">
    <span
      class="flex size-16 items-center justify-center rounded-md bg-white p-2 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"
    >
      <img src={getGuildIconUrl(data.guild)} alt="" class="max-size-14 size-full" />
    </span> 
    <div class="space-y-1">
      <span class="uppercase font-semibold text-slate-400 dark:text-slate-500 text-sm font-mono flex gap-1">
        <PermissionIcon class="size-5" permission={data.guild.permission} /> {nameApiPermission(data.guild.permission)}
      </span>
      <h1 class="text-2xl text-slate-700 dark:text-slate-200 font-semibold">{data.guild.name}</h1> 
    </div>
  </div>
</div>
