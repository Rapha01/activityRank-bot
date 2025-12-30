import { env } from '$env/dynamic/public';

/**
 * Returns the canonical absolute URL for a given relative path.
 *
 * @param relativePath - Optional relative path to append to the base URL.
 * @returns The absolute canonical URL as a string.
 * @example
 * getCanonicalUrl('/about') // => 'https://example.com/about'
 */
export function getCanonicalUrl(relativePath?: string) {
  return new URL(relativePath ?? '.', env.PUBLIC_ORIGIN).toString();
}

/**
 * Returns a path under the canonical URL of the site, or `null` if `null` is provided.
 *
 * This function prevents open redirect vulnerabilities by ensuring the returned URL is always
 * under the canonical site domain.
 *
 * See: https://thecopenhagenbook.com/open-redirect
 *
 * @param path - The path or URL to sanitise. If absolute and not under the site, returns canonical root.
 * @returns A safe absolute URL string or `null`.
 * @example
 * sanitiseRedirect('/dashboard') // => 'https://example.com/dashboard'
 * sanitiseRedirect('https://phishing.com') // => 'https://example.com/'
 * sanitiseRedirect(null) // => null
 */
export function sanitiseRedirect(path: string | URL): string;
export function sanitiseRedirect(path: null): null;
export function sanitiseRedirect(path: string | URL | null): string | null;
export function sanitiseRedirect(path: string | URL | null): string | null {
  // Parsing the URL like this allows for both relative and absolute paths
  // to be provided, as long as they are relative to the root.
  const canonicalURL = new URL(getCanonicalUrl());
  let url = path ? new URL(path, canonicalURL) : null;

  if (url?.hostname !== canonicalURL.hostname) {
    url = canonicalURL;
  }

  return url?.toString();
}
