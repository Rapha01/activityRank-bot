<script lang="ts">
  import CheckIcon from '@lucide/svelte/icons/circle-check';
  import MessageIcon from '@lucide/svelte/icons/message-circle';
  import { ToggleGroup } from 'bits-ui';
  import Switch from '$components/Switch.svelte';
  import SwitchEntry from '$components/SwitchEntry.svelte';
  import { getGuildIconUrl } from '$lib/util';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
</script>

<div class="w-full">
  <!-- <div class="rounded-xl flex items-center gap-4 p-4 bg-theme-400/20 border-2 border-theme-400/50 w-full">
    <span
      class="flex size-16 items-center justify-center rounded-md bg-white p-2 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"
    >
      <img src={getGuildIconUrl(data.guild)} alt="" class="max-size-14 size-full" />
    </span> 
    <div class="space-y-1">
      <h1 class="text-2xl text-slate-700 dark:text-slate-200 font-semibold">{data.guild.name}</h1> 
    </div>
  </div> -->
  <div class="pb-12">
    <h2 class="text-base/7 font-semibold pb-4">General Options</h2>
    <!-- <p class="mt-1 text-sm/6 text-gray-600">This information will be displayed publicly so be careful what you share.</p> -->
    <div class="grid w-full gap-4 md:grid-cols-2">
      <SwitchEntry label="Use Nicknames" description="Display users' nicknames instead of their Discord usernames" />
      <SwitchEntry label="Reaction Voting" description="Allow members to give upvotes using the server's voteEmote" />
      <SwitchEntry label="Update Roles on Level Down" description="Remove roles when a member loses XP" />
      <SwitchEntry label="Reset Deleted Members" />
      <SwitchEntry label="Give Roles on Rejoin" description="Gives members that have left the server the appropriate roles for the level they had when they left." />
    </div>
  </div>
  <div class="pb-12">
    <h2 class="text-base/7 font-semibold pb-4">Voice Options</h2>
    <div class="grid w-full md:grid-cols-2">
      <SwitchEntry label="Muted XP" description="Allow members to gain voice XP while muted." />
      <SwitchEntry label="Deafened XP" description="Allow members to gain voice XP while deafened." />
      <SwitchEntry label="Solo XP" description="Allow members to gain voice XP while alone in a voice channel. Bots don't count." />
    </div>
  </div>
  <div class="pb-12">
    <h2 class="text-base/7 font-semibold">XP Options</h2>
    <p class="mt-1 text-sm/6 text-gray-600 dark:text-gray-400 pb-4">Display or hide each type of XP.</p>
  <ToggleGroup.Root type="multiple" class="grid gap-2 grid-cols-2 md:grid-cols-3">
    <ToggleGroup.Item value="text" class="flex items-center text-sm relative group gap-2 p-3 border-2 border-slate-900/60 dark:border-slate-200/60 data-[state=on]:border-teal-600 rounded-lg data-[state=on]:bg-teal-600/20 data-[state=off]:text-slate-900/60 dark:data-[state=off]:text-slate-200/60">
      <MessageIcon />
      <div class="text-start">
        <div class="font-semibold">Text Messages</div>
        <div class="">XP for each message sent in a text channel</div>
      </div>
    </ToggleGroup.Item>
    <ToggleGroup.Item value="voice" class="flex items-center text-sm relative group gap-2 p-3 border-2 border-slate-900/60 dark:border-slate-200/60 data-[state=on]:border-teal-600 rounded-lg data-[state=on]:bg-teal-600/20 data-[state=off]:text-slate-900/60 dark:data-[state=off]:text-slate-200/60">
      <MessageIcon />
      <div class="text-start">
        <div class="font-semibold">Voice Minutes</div>
        <div class="">XP for each minute spent in a voice channel</div>
      </div>
    </ToggleGroup.Item>
    <ToggleGroup.Item value="invite" class="flex items-center text-sm relative group gap-2 p-3 border-2 border-slate-900/60 dark:border-slate-200/60 data-[state=on]:border-teal-600 rounded-lg data-[state=on]:bg-teal-600/20 data-[state=off]:text-slate-900/60 dark:data-[state=off]:text-slate-200/60">
      <MessageIcon />
      <div class="text-start">
        <div class="font-semibold">Invites</div>
        <div class="">XP for each new member invited to the server</div>
      </div>
    </ToggleGroup.Item>
    <ToggleGroup.Item value="upvote" class="flex items-center text-sm relative group gap-2 p-3 border-2 border-slate-900/60 dark:border-slate-200/60 data-[state=on]:border-teal-600 rounded-lg data-[state=on]:bg-teal-600/20 data-[state=off]:text-slate-900/60 dark:data-[state=off]:text-slate-200/60">
      <MessageIcon />
      <div class="text-start">
        <div class="font-semibold">Upvotes</div>
        <div class="">XP periodically granted by other members</div>
      </div>
    </ToggleGroup.Item>
  </ToggleGroup.Root>
</div>
</div>
