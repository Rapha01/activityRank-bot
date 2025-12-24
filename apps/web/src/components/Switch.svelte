<script lang="ts">
  import { Switch, Label, useId, type WithoutChildrenOrChild } from "bits-ui";
 
  let {
    id = useId(),
    checked = $bindable(false),
    ref = $bindable(null),
    labelText,
    ...restProps
  }: WithoutChildrenOrChild<Switch.RootProps> & {
    labelText: string;
  } = $props();
</script>
 
<Switch.Root bind:checked bind:ref {id} class="bg-slate-800/20 dark:bg-white/10 data-[state=checked]:bg-teal-500 peer inline-flex h-5 min-h-5 w-9 shrink-0 cursor-pointer items-center rounded-full px-1 transition-colors disabled:cursor-not-allowed disabled:opacity-50" {...restProps}>
  <Switch.Thumb class="bg-white dark:bg-slate-200 dark:border-slate-500/30 pointer-events-none block size-4 shrink-0 rounded-full transition-transform data-[state=checked]:translate-x-3.5 data-[state=unchecked]:translate-x-0 dark:border dark:data-[state=unchecked]:border" />
</Switch.Root>
<Label.Root for={id} class="text-sm font-medium">
  {labelText}
</Label.Root>

