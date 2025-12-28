import type { RequestEvent } from '@sveltejs/kit';
import { Discord } from 'arctic';
import invariant from 'tiny-invariant';
import { env } from '$env/dynamic/private';
import { getCanonicalUrl } from '$lib/redirect';

export const discord = null;
let client = null;
export function arcticClient() {
  invariant(env.DISCORD_ID, env.DISCORD_SECRET);
  client ??= new Discord(env.DISCORD_ID, env.DISCORD_SECRET, getCanonicalUrl('/login/callback'));
  return client;
}

const OAUTH_COOKIE_NAME = 'oauth_state';

interface OauthState {
  state: string;
  redirect: string;
}

export function createOauthProcessCookie(event: RequestEvent, state: string, redirect: string) {
  const cookie = { state, redirect };
  event.cookies.set(OAUTH_COOKIE_NAME, encodeURIComponent(JSON.stringify(cookie)), {
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 mins
  });
}

export function getOauthProcessCookie(event: RequestEvent): string | undefined {
  return event.cookies.get(OAUTH_COOKIE_NAME);
}

export function parseOauthProcessCookie(event: RequestEvent): OauthState | null {
  const cookie = getOauthProcessCookie(event);
  if (!cookie) {
    return null;
  }

  const decoded = decodeURIComponent(cookie);

  try {
    return JSON.parse(decoded) as OauthState;
  } catch {
    return null;
  }
}

export function deleteOauthProcessCookie(event: RequestEvent) {
  event.cookies.set(OAUTH_COOKIE_NAME, '', {
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 0,
  });
}
