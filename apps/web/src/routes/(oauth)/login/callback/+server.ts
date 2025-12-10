import { error, redirect } from '@sveltejs/kit';
import type { OAuth2Tokens } from 'arctic';
import { discord, parseOauthProcessCookie } from '$lib/server/auth/oauth';
import {
  createSession,
  generateSessionToken,
  setSessionTokenCookie,
} from '$lib/server/auth/session';
import { createUser, getUser, updateUserDetails } from '$lib/server/auth/user';
import { userApiHandle } from '$lib/server/discord.js';

function badRequest(): never {
  error(400, { message: 'Bad Request: Please restart the OAuth login process.' });
}

export async function GET(event) {
  const code = event.url.searchParams.get('code');
  const state = event.url.searchParams.get('state');
  const storedState = await parseOauthProcessCookie(event);

  // OAuth2 standard guarantees `code` and `state`;
  // `storedState` should exist unless the user took over 10 minutes
  // (the expiry duration of the OAuth Process cookie) to complete the OAuth flow.
  // `state` must be equal to `storedState.state` to prevent CSRF and clickjacking
  // (see https://discord.com/developers/docs/topics/oauth2#state-and-security)
  const isInvalidRequest = !code || !state || !storedState || state !== storedState.state;

  if (isInvalidRequest) {
    badRequest();
  }

  let tokens: OAuth2Tokens;
  try {
    tokens = await discord.validateAuthorizationCode(code, null);
  } catch {
    // Invalid code or client credentials
    badRequest();
  }

  const userResult = await userApiHandle(tokens.accessToken()).users.getCurrent();

  const existingUser = await getUser(userResult.id);

  if (!existingUser) {
    await createUser({
      id: userResult.id,
      username: userResult.username,
      avatarHash: userResult.avatar,
    });
  } else if (
    userResult.username !== existingUser.username ||
    userResult.avatar !== existingUser.avatarHash
  ) {
    await updateUserDetails(userResult.id, {
      username: userResult.username,
      avatarHash: userResult.avatar,
    });
  }

  const sessionToken = await generateSessionToken();
  const session = await createSession(sessionToken, {
    id: userResult.id,
    accessToken: tokens.accessToken(),
    refreshToken: tokens.refreshToken(),
    expiresAt: tokens.accessTokenExpiresAt(),
  });
  setSessionTokenCookie(event, sessionToken, session.expiresAt);
  redirect(307, storedState.redirect);
}
