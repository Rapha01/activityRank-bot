import { describe, expect, it, vi } from 'vitest';

// Mock $env/dynamic/public for testing
const PUBLIC_BASE_URL = 'https://example.com';
vi.mock('$env/dynamic/public', () => ({
  env: { PUBLIC_BASE_URL },
}));

import { getCanonicalUrl, sanitiseRedirect } from './redirect';

describe('getCanonicalUrl', () => {
  it('returns the base URL when no path is given', () => {
    expect(getCanonicalUrl()).toBe('https://example.com/');
  });

  it('returns canonical URL with given relative path', () => {
    expect(getCanonicalUrl('about')).toBe('https://example.com/about');
    expect(getCanonicalUrl('/contact')).toBe('https://example.com/contact');
  });

  it('handles dot/empty string as current root', () => {
    expect(getCanonicalUrl('.')).toBe('https://example.com/');
    expect(getCanonicalUrl('')).toBe('https://example.com/');
  });
});

describe('sanitiseRedirect', () => {
  it('returns null for null', () => {
    expect(sanitiseRedirect(null)).toBeNull();
  });

  it('returns canonical URL for root path', () => {
    expect(sanitiseRedirect('/')).toBe('https://example.com/');
  });

  it('returns canonical URL for relative path', () => {
    expect(sanitiseRedirect('/dashboard')).toBe('https://example.com/dashboard');
    expect(sanitiseRedirect('profile')).toBe('https://example.com/profile');
  });

  it('returns canonical root for absolute external URLs', () => {
    expect(sanitiseRedirect('https://evil.com')).toBe('https://example.com/');
    expect(sanitiseRedirect(new URL('https://not-example.com/foo'))).toBe('https://example.com/');
  });

  it('returns canonical root for absolute URLs with different subdomains', () => {
    expect(sanitiseRedirect('https://sub.example.com')).toBe('https://example.com/');
  });

  it('accepts URL objects', () => {
    expect(sanitiseRedirect(new URL('/abc', PUBLIC_BASE_URL))).toBe('https://example.com/abc');
  });

  it('handles relative path traversal safely', () => {
    expect(sanitiseRedirect('../etc/passwd')).toBe('https://example.com/etc/passwd');
  });
});
