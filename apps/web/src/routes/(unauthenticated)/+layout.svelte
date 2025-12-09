<script lang="ts">
	import type { LayoutProps } from './$types';
	import Nav from '../../components/Nav.svelte';

	const { children, data }: LayoutProps = $props();
</script>

<div class="flex min-h-dvh w-full flex-col items-center justify-center">
	<Nav user={data.user} />
	{@render children()}
</div>
