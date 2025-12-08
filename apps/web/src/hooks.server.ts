import { redirect, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import {
  deleteSessionTokenCookie,
  SESSION_COOKIE_NAME,
  setSessionTokenCookie,
  validateSessionToken,
} from '$lib/server/auth/session';
import { TokenBucket } from '$lib/server/rate-limit';

const bucket = new TokenBucket<string>(100, 1);

const rateLimitHandle: Handle = async ({ event, resolve }) => {
  // Note: Assumes X-Forwarded-For will always be defined.
  const clientIP = event.request.headers.get('X-Forwarded-For');
  if (clientIP === null) {
    return resolve(event);
  }
  let cost: number;
  if (event.request.method === 'GET' || event.request.method === 'OPTIONS') {
    cost = 1;
  } else {
    cost = 3;
  }
  if (!bucket.consume(clientIP, cost)) {
    return new Response('Too many requests', {
      status: 429,
    });
  }
  return resolve(event);
};

const authenticationHandle: Handle = async ({ event, resolve }) => {
  const token = event.cookies.get(SESSION_COOKIE_NAME) ?? null;
  if (token === null) {
    event.locals.user = null;
    event.locals.session = null;
    return resolve(event);
  }

  const { session, user } = await validateSessionToken(token);
  if (session !== null) {
    setSessionTokenCookie(event, token, session.expiresAt);
  } else {
    deleteSessionTokenCookie(event);
  }

  event.locals.session = session;
  event.locals.user = user;
  // inspired by authjs: https://authjs.dev/reference/sveltekit
  event.locals.auth = () => {
    if (session === null || user === null) {
      return redirect(303, '/login');
    }
    return { session, user };
  };

  return resolve(event);
};

const authorizationHandle: Handle = async ({ event, resolve }) => {
  if (event.url.pathname.startsWith('/dashboard')) {
    if (!event.locals.session) {
      throw redirect(303, '/login');
    }
  }

  return resolve(event);
};

export const handle = sequence(rateLimitHandle, authenticationHandle, authorizationHandle);
