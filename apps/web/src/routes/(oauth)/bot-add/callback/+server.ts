import { error, redirect } from '@sveltejs/kit';
import { getCanonicalUrl } from '$lib/redirect.js';

function badRequest(): never {
  error(400, { message: 'Bad Request: Please restart the OAuth login process.' });
}

export async function GET(event) {
  const code = event.url.searchParams.get('code');
  const state = event.url.searchParams.get('state');
  const guildId = event.url.searchParams.get('guild_id');

  const storedState = event.cookies.get('bot_add_flow');

  // - OAuth2 standard guarantees `code` and `state`;
  //   `storedState` should exist unless the user took over 10 minutes
  //   (the expiry duration of the OAuth Process cookie) to complete the OAuth flow.
  // - `state` must be equal to `storedState.state` to prevent CSRF and clickjacking
  //   (see https://discord.com/developers/docs/topics/oauth2#state-and-security)
  // - `guild_id` should be present
  //   (see https://discord.com/developers/docs/topics/oauth2#advanced-bot-authorization)
  const isInvalidRequest = !code || !state || !storedState || !guildId || state !== storedState;

  if (isInvalidRequest) {
    badRequest();
  }

  redirect(307, getCanonicalUrl(`/dashboard/${guildId}`));
}
