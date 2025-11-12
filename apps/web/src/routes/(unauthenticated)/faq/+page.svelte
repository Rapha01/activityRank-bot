<script lang="ts">
	import DiscordLogo from '$lib/assets/logos/discord.svelte';
</script>

<main class="flex h-full flex-1 flex-col items-center justify-center">
	<div class="flex flex-col items-center gap-6 px-8 md:gap-10">
		<span class="text-8xl">🚧</span>
		<h1 class="text-4xl font-extrabold text-slate-900 dark:text-slate-100">
			Frequently Asked Questions
		</h1>
		<p class="text-slate-800 dark:text-slate-200">
			The FAQ page is currently under construction. Please check our Discord Support Server's #faq
			channel for info.
		</p>
		<a
			href="/support"
			class="flex items-center gap-2 rounded-xl bg-gradient-to-r from-theme-200 to-theme-400 px-12 py-4 text-xl font-semibold text-slate-800"
		>
			<DiscordLogo class="size-8" /> Support Server
		</a>
	</div>
</main>
