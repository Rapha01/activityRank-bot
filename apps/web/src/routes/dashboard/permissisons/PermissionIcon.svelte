<script lang="ts">
  import type { IconProps } from '@lucide/svelte';
  import ShieldBanIcon from '@lucide/svelte/icons/shield-ban';
  import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
  import ShieldUserIcon from '@lucide/svelte/icons/shield-user';
  import UsersIcon from '@lucide/svelte/icons/users';
  import PermissionPopover from './PermissionPopover.svelte';
  import type { ExtendedPermissionLevel } from './permissions';

  type Props = {
    permission: ExtendedPermissionLevel;
  };
  const { permission, ...restProps }: IconProps & Props = $props();
</script>

<PermissionPopover {permission}>
    {#if permission ==='OWNER'}
        <ShieldUserIcon {...restProps} />
    {:else if permission ==='ADMINISTRATOR'}
        <ShieldBanIcon {...restProps} />
    {:else if permission ==='MODERATOR'}
        <ShieldCheckIcon {...restProps} />
    {:else if permission ==='MEMBER'}
        <UsersIcon {...restProps} />
    {/if}
</PermissionPopover>
