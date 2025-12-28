import { redirect } from '@sveltejs/kit';
import { generateState } from 'arctic';
import { sanitiseRedirect } from '$lib/redirect';
import { arcticClient, createOauthProcessCookie } from '$lib/server/auth/oauth';

// TODO: add any other needed scopes
const SCOPES = [
  // get current user
  'identify',
  // get list of current user's guilds
  'guilds',
];

export async function load(event) {
  const state = generateState();
  // codeVerifier: null because Discord doesn't support PKCE
  const url = arcticClient().createAuthorizationURL(state, null, SCOPES);
  // prompt=none skips authorization flow if already authed
  url.searchParams.set('prompt', 'none');

  const callback = sanitiseRedirect(event.url.searchParams.get('callback'));
  createOauthProcessCookie(event, state, callback ?? '/');

  redirect(307, url.toString());
}
