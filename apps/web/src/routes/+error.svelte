<script lang="ts">
  import { page } from '$app/state';
  import Nav from '../components/Nav.svelte';
</script>

<div class="flex h-full grow flex-col items-center justify-center *:z-10">
	<Nav skipUserInfo />
	<main class="flex h-full flex-1 flex-col items-center justify-center">
		<div class="flex flex-col items-center gap-6">
			<code class="font-mono text-slate-600 dark:text-slate-400">Error {page.status}</code>
			<h1
				class="mb-4 bg-linear-to-b from-theme-700 to-theme-800 bg-clip-text text-4xl font-semibold text-transparent md:text-6xl/relaxed dark:from-theme-200 dark:to-theme-400"
			>
				Oops!
			</h1>
			{#if page.error}
				<pre class="text-slate-700 dark:text-slate-300">{page.error.message}</pre>
			{/if}
			<a
				href="/"
				class={[
        "flex items-center gap-2 rounded-xl px-12 py-4 text-xl font-semibold text-slate-800",
        "bg-linear-to-r from-theme-200 via-50% via-theme-400 to-theme-700 transition-[background-position] duration-500 bg-size-[200%_100%] bg-position-[0_0] hover:bg-position-[100%_0]"
      ]}
			>
				Go back Home
			</a>
		</div>
	</main>
</div>
