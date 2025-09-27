<script lang="ts">
	import GithubLogo from '$lib/assets/logos/github.svelte';
</script>

<main class="flex h-full flex-1 flex-col items-center justify-center">
	<div class="flex flex-col items-center gap-6 px-8 md:gap-10">
		<span class="text-8xl">🚧</span>
		<h1 class="text-4xl font-extrabold text-slate-900 dark:text-slate-100">Patchnotes</h1>
		<p class="text-slate-800 dark:text-slate-200">
			The patchnotes are currently under construction. Please check the GitHub releases and commits
			for updates.
		</p>
		<a
			href="/github"
			class="flex items-center gap-2 rounded-xl bg-gradient-to-r from-theme-200 to-theme-400 px-12 py-4 text-xl font-semibold text-slate-800"
		>
			<GithubLogo class="size-8" /> GitHub
		</a>
	</div>
</main>
