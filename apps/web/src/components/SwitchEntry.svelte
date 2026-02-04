<script lang="ts">
  import { Label, useId } from 'bits-ui';
  import Switch from './Switch.svelte';

  let {
    id = useId(),
    checked = $bindable(false),
    ref = $bindable(null),
    label,
    description,
    ...restProps
  }: {
    id?: string;
    checked?: boolean;
    ref?: HTMLElement | null;
    label: string;
    description?: string;
  } = $props();
</script>
 

<Label.Root class="flex px-4 py-2 items-center justify-between" {...restProps}>
  <div class="text-sm pe-2">
    <div class="font-medium">{label}</div>
    {#if description}
      <div class="text-slate-900/70 dark:text-slate-100/70">{description}</div>
    {/if}
  </div>
  <Switch bind:checked bind:ref {id} />
</Label.Root>

