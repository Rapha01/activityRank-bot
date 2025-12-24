<script lang="ts">
	import type { Snippet } from "svelte";
	import { Popover } from "bits-ui";
	import { namePermission, type ExtendedPermissionLevel } from "./permissions";

    type Props = { 
        permission: ExtendedPermissionLevel;
        children: Snippet
    };

    const { children, permission }: Props = $props()
    const dispPermission = $derived.by(() => namePermission(permission))
</script>

<Popover.Root>
    <Popover.Trigger>
        {@render children?.()}
    </Popover.Trigger>
    <Popover.Portal>
        <Popover.Content side="top" sideOffset={4}>
            <Popover.Arrow class="text-slate-950/50 dark:text-white/50" />
            <div
                class="rounded-md bg-slate-200 dark:bg-slate-800 shadow-md border-2 border-slate-950/50 dark:border-white/50 py-1 px-2 text-sm font-medium text-slate-950 dark:text-slate-100"
            >
                {dispPermission}
            </div>
        </Popover.Content>
    </Popover.Portal>
</Popover.Root>
