<script lang="ts">
  import { Label } from 'bits-ui';
  import SwitchEntry from '$components/SwitchEntry.svelte';
  import type { PageProps } from './$types';
  import Editor from './Editor.svelte';

  let { data }: PageProps = $props();
</script>

<div class="w-full">
  <div class="pb-12">
    <h2 class="text-base/7 font-semibold pb-4">Notification Options</h2>
    <div class="grid w-full gap-4 md:grid-cols-2">
      <SwitchEntry label="Notify by DM" description="Allow members to recieve levelup notifications by DM." />
      <SwitchEntry label="Notify in Last Active Channel" description="Send levelup notifications in a member's last active text channel." />
      <SwitchEntry label="Include Levelup Message" description="Send the levelup message even if a level has a role assignment message set." />
    </div>
  </div>
  <div class="pb-12">
    <h2 class="text-base/7 font-semibold pb-4">Default Messages</h2>
    <Label.Root class="flex px-4 py-2 items-center justify-between">
      <div class="text-sm pe-2 w-full">
        <div class="font-medium">Server Join Message</div>
        <div class="text-slate-900/70 dark:text-slate-100/70 pb-2">Sent when a member joins the server.</div>
        <Editor maxChars={20} />
      </div>
    </Label.Root>
    <Label.Root class="flex px-4 py-2 items-center justify-between">
      <div class="text-sm pe-2 w-full">
        <div class="font-medium">Levelup Message</div>
        <div class="text-slate-900/70 dark:text-slate-100/70 pb-2">Sent when a member gains a level.</div>
        <Editor maxChars={20} />
      </div>
    </Label.Root>
  </div>
</div>
