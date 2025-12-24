<script lang="ts">
	import { getGuildIconUrl, getGuildInviteUrl } from "$lib/util";
	import PermissionIcon from "./permissisons/PermissionIcon.svelte";
    import SettingsIcon from '@lucide/svelte/icons/settings-2';
	import UserPlusIcon from '@lucide/svelte/icons/user-plus';
	import type { ExtendedPermissionLevel } from "./permissisons/permissions";


    type Props = {
        id: string;
        icon: string | null;
        name: string;
        bot: true;
        permission: ExtendedPermissionLevel
    } | {
        id: string;
        icon: string | null;
        name: string;
        bot: false;
    }
    const props: Props = $props();
</script>

<li class="flex items-center gap-4 p-4 bg-slate-950/5 dark:bg-white/5 rounded-md border-2 border-slate-950/30 dark:border-slate-50/20 h-full">
    <img src={getGuildIconUrl(props.id, props.icon)} class="size-16 rounded-md" alt=""/>
    <div class="flex flex-col gap-2">
        <h2 class="flex gap-2 font-bold">
            {props.name} 
            {#if props.bot}
                <PermissionIcon permission={props.permission} />
            {/if}
        </h2>
        <a href={props.bot ? `/dashboard/${props.id}` : getGuildInviteUrl(props.id)} class="flex gap-2 rounded-md py-1 px-2 bg-slate-500/20 hover:bg-slate-500/30 self-start">
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
