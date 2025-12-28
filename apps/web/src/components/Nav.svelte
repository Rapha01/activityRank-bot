<script lang="ts">
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
  import PanelLeftCloseIcon from '@lucide/svelte/icons/panel-left-close';
  import PanelLeftOpenIcon from '@lucide/svelte/icons/panel-left-open';
  import SquareArrowOutUpRightIcon from '@lucide/svelte/icons/square-arrow-out-up-right';
  import { Dialog } from 'bits-ui';
  import { page } from '$app/state';
  import logo from '$lib/assets/favicon.svg';
  import DiscordLogo from '$lib/assets/logos/discord.svelte';
  import type { User } from '$lib/server/auth/user';
  import { getUserAvatarUrl } from '$lib/util';
  import ThemeSwitcher from './ThemeSwitcher.svelte';

  let navigation = [
    { href: '/faq', name: 'FAQ', external: false },
    { href: '/patchnotes', name: 'Patchnotes', external: false },
    { href: '/support', name: 'Support', external: true },
    { href: '/premium', name: 'Premium', external: true },
  ];

  type Props =
    | {
        /** The user to show in the navbar. If none is provided, a Log In button is displayed instead. */
        user: User | null;
        /** whether to skip including the user / Log In button at all */
        skipUserInfo?: false;
      }
    | {
        /** whether to skip including the user / Log In button at all */
        skipUserInfo: true;
      };

  const props: Props = $props();
</script>

<header
	class="flex w-full items-center text-slate-800 shadow-md dark:border-b dark:border-slate-700 dark:text-slate-200"
>
	<Dialog.Root>
		<Dialog.Trigger class="my-1 ml-1 block size-10 p-2 md:hidden">
			<PanelLeftOpenIcon class="size-full stroke-[1.5]" />
		</Dialog.Trigger>
		<Dialog.Portal>
			<Dialog.Overlay
				class="fixed inset-0 z-50 bg-black/20 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 dark:bg-black/80"
			/>
			<Dialog.Content
				class={[
					'z-50 rounded-lg data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95',
					'z-10 min-w-32 rounded-lg border border-slate-950/20 bg-slate-100 p-1 text-slate-800 not-dark:shadow-md dark:border-white/20 dark:bg-slate-900 dark:text-slate-200',
					'absolute top-2 left-2 p-4',
				]}
			>
				<ul class="flex flex-col gap-4">
					<Dialog.Close class="block size-6">
						<PanelLeftCloseIcon class="size-full stroke-[1.5]" />
					</Dialog.Close>
					<div class="h-px w-3/5 place-self-center bg-black/20 dark:bg-white/10"></div>
					{#each navigation as nav}
						<a
							href={nav.href}
							data-active={page.url.pathname === nav.href ? '' : undefined}
							class="flex items-center gap-2 data-active:font-semibold data-active:text-slate-800/80 dark:data-active:text-slate-200/80"
						>
							{nav.name}
							{#if nav.external}
								<SquareArrowOutUpRightIcon class="size-4 text-slate-600 dark:text-slate-400" />
							{/if}
						</a>
					{/each}
				</ul>
			</Dialog.Content>
		</Dialog.Portal>
	</Dialog.Root>
	<a href="/" class="m-1 size-10 p-1">
		<img src={logo} alt="" class="size-full" />
	</a>
	<nav class="flex-1">
		<ul class="hidden gap-4 md:flex">
			{#each navigation as nav}
				<a
					href={nav.href}
					data-active={page.url.pathname === nav.href ? '' : undefined}
					class="flex items-center gap-2 px-4 py-2 hover:text-slate-800/80 dark:hover:text-slate-200/80 data-active:font-semibold data-active:text-slate-800/80 dark:data-active:text-slate-200/80"
				>
					{nav.name}
					{#if nav.external}
						<SquareArrowOutUpRightIcon class="size-4 text-slate-600" />
					{/if}
				</a>
			{/each}
		</ul>
	</nav>
	<div class="flex gap-1 items-center">
		<ThemeSwitcher />
    {#if !props.skipUserInfo}
      {#if props.user}
        <a href="/dashboard" class="mx-2 px-2 py-1 rounded-md hover:bg-slate-900/10 dark:hover:bg-white/5 flex items-center gap-1">
          <span class="flex items-center gap-2">
            Dashboard
            <img src={getUserAvatarUrl(props.user)} class="size-7 border border-slate-950 rounded-full" alt=""/>
          </span>
          <ArrowRightIcon class="size-4" />
        </a>
      {:else}
        <a href="/login" class="mx-2 px-2 py-1 rounded-md hover:bg-slate-900/10 dark:hover:bg-white/5 flex items-center gap-2">
          <DiscordLogo class="size-5" />
          <span>Log In</span>
          <ArrowRightIcon class="size-4" />
        </a>
      {/if}
		{/if}
	</div>
</header>
