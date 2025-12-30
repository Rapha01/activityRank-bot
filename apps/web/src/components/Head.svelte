<script lang="ts">
  import { page } from '$app/state';
  import { getHomeJsonLd, getJsonLdPageBreadcrumbs } from '$lib/seo';

  interface Props {
    /** The title of the page. */
    title: string;
    /** A brief description of the page. */
    description: string;
    /** Whether to skip adding OpenGraph and Twitter Card tags. */
    disableOpenGraph?: boolean;
    /** An alternate image to show instead of the default OpenGraph image (see `static/og.png`) */
    openGraphImage?: string;
    /** An alternate description to show in OpenGraph embeds. Search engines will still use `description`. */
    openGraphDescription?: string;
    /** Override the `<link rel="canonical">` tag. By default, it will use the current URL. */
    canonicalUrl?: string;
    /** Whether to disable indexing on this page. */
    restricted?: boolean;
  }

  function resolvePath(path: string) {
    const url = new URL(page.url);
    url.pathname = path;
    return url.toString();
  }

  const {
    title,
    description,
    disableOpenGraph = false,
    openGraphImage,
    canonicalUrl = page.url.toString(),
    restricted = false,
  }: Props = $props();

  const ogImage = $derived(openGraphImage ?? resolvePath('/og.png'));
</script>

<svelte:head>
	<title>{title} • ActivityRank</title>
	<meta name="description" content={description} />

  <link rel="canonical" href={canonicalUrl} />

  <meta
    name="theme-color"
    content="#42e0f0"
    media="(prefers-color-scheme: light)" />
  <meta
    name="theme-color"
    content="#3e72cc"
    media="(prefers-color-scheme: dark)" />

  {#if page.url.pathname === '/'}
    {@html getHomeJsonLd(description)}
  {:else}
    {@html getJsonLdPageBreadcrumbs(title, page.url.pathname)}
  {/if}

  {#if !disableOpenGraph}
    <meta property="og:type" content="website" />
    <meta property="og:url" content={canonicalUrl} />
    <meta property="og:site_name" content={page.url.pathname === '/' ? 'activityrank.me' : "ActivityRank"} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description}/>
    <meta property="og:image" content={ogImage} />

    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content={title}>
    <meta name="twitter:description" content={description}>
    <meta name="twitter:image" content={ogImage} />
  {/if}

  {#if restricted}
    <meta name="robots" content="noindex">
  {/if}
</svelte:head>
