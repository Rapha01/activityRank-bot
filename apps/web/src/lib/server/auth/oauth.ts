import type { RequestEvent } from '@sveltejs/kit';
import { Discord } from 'arctic';
import invariant from 'tiny-invariant';
import { env } from '$env/dynamic/private';
import { getCanonicalUrl } from '$lib/redirect';

invariant(env.DISCORD_ID && env.DISCORD_SECRET);

const REDIRECT = getCanonicalUrl('/auth/callback');

export const discord = new Discord(env.DISCORD_ID, env.DISCORD_SECRET, REDIRECT);

const OAUTH_COOKIE_NAME = 'oauth_state';

interface OauthState {
  state: string;
  redirect: string;
}

export async function createOauthProcessCookie(
  event: RequestEvent,
  state: string,
  redirect: string,
) {
  const cookie = { state, redirect };
  event.cookies.set(OAUTH_COOKIE_NAME, encodeURIComponent(JSON.stringify(cookie)), {
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 mins
  });
}

export async function getOauthProcessCookie(event: RequestEvent): Promise<string | undefined> {
  return event.cookies.get(OAUTH_COOKIE_NAME);
}

export async function parseOauthProcessCookie(event: RequestEvent): Promise<OauthState | null> {
  const cookie = await getOauthProcessCookie(event);
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

export async function deleteOauthProcessCookie(event: RequestEvent) {
  event.cookies.set(OAUTH_COOKIE_NAME, '', {
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 0,
  });
}
