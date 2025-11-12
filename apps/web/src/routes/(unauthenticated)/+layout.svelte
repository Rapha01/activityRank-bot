<script>
	import Nav from '../../components/Nav.svelte';

	const { children } = $props();
</script>

<div class="flex min-h-dvh w-full flex-col items-center justify-center *:z-10">
	<Nav />
	{@render children()}
</div>
