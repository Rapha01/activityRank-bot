import { error, fail, redirect } from '@sveltejs/kit';
import { deleteSessionTokenCookie, invalidateSession } from '$lib/server/auth/session';
import { userApiHandle } from '$lib/server/discord';
import type { Actions, RequestEvent } from './$types';

export async function load(event) {
  const guildId = event.params.guild;
  if (!/^\d{17,20}$/.test(guildId)) error(404);

  const { session, user } = event.locals.auth();

  const guilds = await userApiHandle(session).users.getGuilds();
  const guild = guilds.find((guild) => guild.id === guildId);

  return {
    user,
    guild,
  };
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
