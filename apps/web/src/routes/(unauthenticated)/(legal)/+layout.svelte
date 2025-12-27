<script>
  const { children } = $props();
</script>

<main class="prose h-full w-full max-w-3xl px-4 py-8 dark:prose-invert prose-ol:list-[lower-alpha]">
	{@render children()}
</main>
