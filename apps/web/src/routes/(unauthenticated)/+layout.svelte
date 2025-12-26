<script lang="ts">
  import Nav from '../../components/Nav.svelte';
  import type { LayoutProps } from './$types';

  const { children, data }: LayoutProps = $props();
</script>

<div class="flex min-h-dvh w-full flex-col items-center justify-center">
	<Nav user={data.user} />
	{@render children()}
</div>
