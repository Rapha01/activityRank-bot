import { error, fail, redirect } from '@sveltejs/kit';
import { getSharedGuilds } from '$lib/api/shared-guilds';
import { deleteSessionTokenCookie, invalidateSession } from '$lib/server/auth/session';
import { hasAccess } from '../hasAccess';
import type { Actions, RequestEvent } from './$types';

export async function load(event) {
  const guildId = event.params.guild;
  if (!/^\d{17,20}$/.test(guildId)) error(404);

  const { user } = event.locals.auth();

  const access = await hasAccess(user.id);
  if (!access) error(403);

  const { sharedGuilds } = await getSharedGuilds(event);
  const guild = sharedGuilds.find((guild) => guild.id === guildId);

  if (!guild) error(404);

  return { user, guild, sharedGuilds };
}

export const actions: Actions = {
  signout,
};

async function signout(event: RequestEvent) {
  if (event.locals.session === null) {
    return fail(401);
  }
  invalidateSession(event.locals.session.id);
  deleteSessionTokenCookie(event);
  return redirect(302, '/');
}
