<script lang="ts">
  import '../app.css';
  import favicon from '$lib/assets/favicon.svg';
  import '@fontsource-variable/manrope';
  import '@fontsource-variable/recursive/mono.css';

  import { onMount } from 'svelte';
  import { ThemeManager } from '$lib/themes.svelte';

  const { children } = $props();

  onMount(() => {
    ThemeManager.getInstance();
  });
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children?.()}
