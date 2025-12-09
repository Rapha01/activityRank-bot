<script lang="ts">
	import { getGuildIconUrl, getGuildInviteUrl } from "$lib/util";
    import SettingsIcon from '@lucide/svelte/icons/settings-2';
    import ShieldUserIcon from '@lucide/svelte/icons/shield-user';
	import ShieldBanIcon from '@lucide/svelte/icons/shield-ban';
	import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
	import UserPlusIcon from '@lucide/svelte/icons/user-plus';
	import PermissionPopover from "./PermissionPopover.svelte";


    type Props = {
        id: string;
        icon: string | null;
        name: string;
        bot: true;
        permission: "OWNER" | "ADMINISTRATOR" | "MODERATOR" | "MEMBER"
    } | {
        id: string;
        icon: string | null;
        name: string;
        bot: false;
    }
    const props: Props = $props();
</script>

<li class="flex items-center gap-4 p-4 bg-slate-950/10 dark:bg-white/5 rounded-md border-2 border-slate-950/50 dark:border-slate-50/20 h-full">
    <img src={getGuildIconUrl(props.id, props.icon)} class="size-16 rounded-md" alt=""/>
    <div class="flex flex-col gap-2">
        <h2 class="flex gap-2 font-bold">
            {props.name} 
            {#if props.bot}
                <PermissionPopover permission={props.permission}>
                    {#if props.permission ==='OWNER'}
                        <ShieldUserIcon class="" />
                    {:else if props.permission ==='ADMINISTRATOR'}
                        <ShieldBanIcon class="" />
                    {:else if props.permission ==='MODERATOR'}
                        <ShieldCheckIcon class="" />
                    {:else if props.permission ==='MEMBER'}
                        ...member
                    {/if}
                </PermissionPopover>
            {/if}
        </h2>
        <a href={props.bot ? `/dashboard/${props.id}` : getGuildInviteUrl(props.id)} class="flex gap-2 rounded-md py-1 px-2 bg-slate-500/20 hover:bg-slate-500/30 self-start">
            {#if props.bot}
                <SettingsIcon class="size-6" /> Manage
            {:else}
                <UserPlusIcon class="size-6" /> Invite ActivityRank
            {/if}
        </a>
    </div>
</li>
