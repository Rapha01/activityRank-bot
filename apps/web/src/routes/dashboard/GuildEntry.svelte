<script lang="ts">
  import SettingsIcon from '@lucide/svelte/icons/settings-2';
  import UserPlusIcon from '@lucide/svelte/icons/user-plus';
  import type { ExtendedApiPermissionLevel } from '$lib/api/permissions';
  import { getGuildIconUrl, getGuildInviteUrl } from '$lib/util';
  import PermissionIcon from './PermissionIcon.svelte';

  type Props =
    | {
        id: string;
        icon: string | null;
        name: string;
        bot: true;
        permission: ExtendedApiPermissionLevel;
      }
    | {
        id: string;
        icon: string | null;
        name: string;
        bot: false;
      };
  const props: Props = $props();
</script>

<li class="flex items-center gap-4 p-4 shadow-md bg-slate-200 dark:bg-slate-800 rounded-md">
  <img src={getGuildIconUrl(props.id, props.icon)} class="size-16 rounded-md" alt=""/>
  <div class="flex flex-col gap-2">
    <h2 class="flex gap-2 font-bold">
      {props.name} 
      {#if props.bot}
          <PermissionIcon permission={props.permission} class="size-6" />
      {/if}
    </h2>
    <a href={props.bot ? `/dashboard/${props.id}` : getGuildInviteUrl(props.id)} class="flex gap-2 rounded-md py-1 px-2 bg-slate-300/50 hover:bg-slate-300/80 dark:bg-slate-700/50 dark:hover:bg-slate-700/80 self-start font-medium">
      {#if props.bot}
        {#if props.permission === 'MEMBER'}
          <!-- TODO -->
          <SettingsIcon class="size-6" /> View Leaderboard 
        {:else}
          <SettingsIcon class="size-6" /> Manage
        {/if}
      {:else}
        <UserPlusIcon class="size-6" /> Invite ActivityRank
      {/if}
    </a>
  </div>
</li>
