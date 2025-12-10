<script>
	import Plus from '@lucide/svelte/icons/plus';
	import Background from './background.svelte';
	import GithubLogo from '$lib/assets/logos/github.svelte';
	import arLogo from '$lib/assets/favicon.svg';
	import { PUBLIC_COMMIT_HASH } from '$env/static/public';
</script>

<Background />
<main class="flex h-full flex-1 flex-col items-center justify-center">
	<div class="flex flex-col items-center gap-12">
		<img src={arLogo} alt="" class="w-32 md:w-48" />
		<h1
			class="bg-linear-to-b from-theme-700 to-theme-800 bg-clip-text text-4xl font-semibold text-transparent md:text-6xl/relaxed dark:from-theme-200 dark:to-theme-400"
		>
			ActivityRank
		</h1>
		<a
			href="/invite"
			class="flex items-center gap-2 rounded-xl bg-linear-to-r from-theme-200 to-theme-400 px-12 py-4 text-xl font-semibold text-slate-800"
		>
			Invite
			<Plus class="size-4" />
		</a>
	</div>
</main>
<footer
	class="mb-2 grid w-full grid-cols-1 justify-items-center px-4 text-text-muted md:grid-cols-[1fr_auto_1fr]"
>
	<div class="hidden md:block"></div>
	<div
		class="flex w-full max-w-lg justify-between justify-items-center text-sm md:grid md:grid-cols-3"
	>
		<a href="/privacy" class="hover:text-slate-700 dark:hover:text-slate-500"> Privacy Policy </a>
		<a href="/about" class="hover:text-slate-700 dark:hover:text-slate-500">About</a>
		<a href="/terms" class="hover:text-slate-700 dark:hover:text-slate-500">
			Terms and Conditions
		</a>
	</div>
	<a
		href="/github"
		class="hidden items-center gap-1 justify-self-end font-mono text-sm hover:text-slate-700 md:flex dark:hover:text-slate-500"
	>
		<GithubLogo class="size-4" />
		{PUBLIC_COMMIT_HASH}
	</a>
</footer>
