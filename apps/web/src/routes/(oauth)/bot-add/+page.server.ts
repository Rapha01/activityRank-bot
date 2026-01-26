import { error, redirect } from '@sveltejs/kit';
import { generateState } from 'arctic';
import { env } from '$env/dynamic/private';
import { getCanonicalUrl } from '$lib/redirect';
import type { PageServerLoad } from './$types';

// NOTE: we do the full Authorization Code Grant flow here (yes, just to add a bot to a server)
// because it allows us to specify a `redirect_uri` parameter.
// If we only used the Bot Authorization Flow (https://discord.com/developers/docs/topics/oauth2#bot-authorization-flow),
// users wouldn't be redirected to the dashboard after adding the bot.
export const load: PageServerLoad = (event) => {
  const guildId = event.url.searchParams.get('guild_id');
  if (!guildId) error(400);

  const state = generateState();

  const url = new URL('https://discord.com/api/oauth2/authorize');
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('integration_type', '0');
  url.searchParams.set('state', state);
  url.searchParams.set('redirect_uri', getCanonicalUrl(`/bot-add/callback`));

  url.searchParams.set('client_id', env.DISCORD_ID);
  url.searchParams.set('permissions', '294172224721');
  url.searchParams.set(
    'scope',
    ['bot', 'applications.commands', 'applications.commands.permissions.update'].join(' '),
  );
  url.searchParams.set('guild_id', guildId);

  event.cookies.set('bot_add_flow', state, {
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 mins
  });

  redirect(307, url.toString());
};
