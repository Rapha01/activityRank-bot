import { fail, redirect } from '@sveltejs/kit';
import { deleteSessionTokenCookie, invalidateSession } from '$lib/server/auth/session';
import type { Actions, RequestEvent } from './$types';

export const actions: Actions = {
  default: signout,
};

async function signout(event: RequestEvent) {
  if (event.locals.session === null) {
    return fail(401);
  }
  invalidateSession(event.locals.session.id);
  deleteSessionTokenCookie(event);
  return redirect(302, '/');
}
