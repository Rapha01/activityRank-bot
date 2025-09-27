<script lang="ts">
	import type { PageProps } from './$types';
	import GithubLogo from '$lib/assets/logos/github.svelte';

	let { data }: PageProps = $props();
</script>

<h1 class="my-8 text-4xl font-extrabold text-slate-900 dark:text-slate-100">About Us</h1>
<ul class="w-full max-w-2xl space-y-4 px-4 py-4 md:mb-8">
	{#each data.staff as member}
		<div class="w-full rounded-xl bg-gradient-to-br from-theme-400 to-theme-700 p-1">
			<li
				class="flex w-full flex-col items-center gap-2 rounded-xl bg-slate-300 px-2 py-4 md:flex-row dark:bg-slate-800"
			>
				<img src={member.avatarUrl} alt="Discord Avatar" class="size-20 rounded-full p-2" />
				<div class="flex flex-col items-center gap-2 md:items-start">
					<span class="flex items-center gap-2">
						<h3 class="pr-2 text-lg font-medium text-slate-800 dark:text-slate-200">
							{member.name}
						</h3>
						{#each member.socials as social}
							{#if social.type === 'GITHUB'}
								<a
									href={`https://github.com/${social.username}`}
									class="size-4 text-slate-500 hover:text-slate-600"
								>
									<GithubLogo />
								</a>
							{/if}
						{/each}
					</span>
					<span class="text-slate-500">
						<span class="font-mono">@{member.username}</span>
						{#if member.pronouns}
							• {member.pronouns}
						{/if}
					</span>
				</div>
				<span
					class="flex-1 justify-self-end px-2 text-end font-medium text-theme-700 dark:text-theme-400"
				>
					{#if member.role === 'CUSTOM'}
						Support Staff &
						<span class="bg-gradient-to-b from-orange-500 to-red-600 bg-clip-text text-transparent">
							Breaker of Bots
						</span>
					{:else}
						{member.role}
					{/if}
				</span>
			</li>
		</div>
	{/each}
</ul>
