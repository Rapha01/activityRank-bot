import { fail, redirect } from '@sveltejs/kit';
import { deleteSessionTokenCookie, invalidateSession } from '$lib/server/auth/session';
import type { Actions, RequestEvent } from './$types';

export async function load(event) {
  if (event.locals.session === null || event.locals.user === null) {
    return redirect(302, '/login?callback=/dashboard');
  }
  return {
    user: event.locals.user,
  };
}

export const actions: Actions = {
  default: action,
};

async function action(event: RequestEvent) {
  if (event.locals.session === null) {
    return fail(401);
  }
  invalidateSession(event.locals.session.id);
  deleteSessionTokenCookie(event);
  return redirect(302, '/');
}
