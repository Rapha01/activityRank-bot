<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();
</script>

<div class="m-8 grid place-items-center space-y-8 text-slate-800 dark:text-slate-200">
	<h1 class="flex items-center gap-6 text-2xl font-bold">
		<img
			class="size-12 rounded-md"
			src={`https://cdn.discordapp.com/avatars/${data.user.id}/${data.user.avatarHash}.png`}
			alt="profile"
		/>
		Hi, @{data.user.username}!
	</h1>
	<span class="text-8xl">🚧</span>
	<p>The dashboard is under construction, but we're working on it!</p>
	<form method="post" use:enhance>
		<button class="rounded-md border-2 border-red-500 bg-red-700/10 px-4 py-2 hover:bg-red-700/20">
            Log Out
        </button>
	</form>
</div>
