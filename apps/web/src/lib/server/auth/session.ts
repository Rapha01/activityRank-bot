import { sha256 } from '@oslojs/crypto/sha2';
import { encodeBase32LowerCase, encodeHexLowerCase } from '@oslojs/encoding';
import type { RequestEvent } from '@sveltejs/kit';
import { manager } from './database';
import { arcticClient } from './oauth';
import type { User } from './user';

export const SESSION_COOKIE_NAME = 'session';
// Refresh 5 days before expiry
const SESSION_REISSUE_THRESHOLD = 1000 * 60 * 60 * 24 * 5;

export async function validateSessionToken(token: string): Promise<SessionValidationResult> {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  const sessionData = await manager.db
    .selectFrom('session')
    .innerJoin('web_user', 'web_user.id', 'session.user_id')
    .select([
      'session.id as session_id',
      'session.user_id',
      'session.access_token',
      'session.refresh_token',
      'session.expires_at',
      'web_user.username',
      'web_user.avatar_hash',
    ])
    .where('session.id', '=', sessionId)
    .executeTakeFirst();

  if (!sessionData) {
    return { session: null, user: null };
  }

  const session: Session = {
    id: sessionData.session_id,
    userId: sessionData.user_id,
    accessToken: sessionData.access_token,
    refreshToken: sessionData.refresh_token,
    expiresAt: sessionData.expires_at,
  };
  const user: User = {
    id: sessionData.user_id,
    username: sessionData.username,
    avatarHash: sessionData.avatar_hash,
  };

  if (Date.now() >= session.expiresAt.getTime()) {
    // attempted to use an expired session
    await invalidateSession(session.id);
    return { session: null, user: null };
  }

  // TODO:
  // Stripe's OAuth Best Practices documentation recommends
  // (https://developer.squareup.com/docs/oauth-api/best-practices#refresh-the-access-token-regularly)
  // that access tokens be refreshed regularly, even without user interaction.
  // This MAY (or may not) be something to consider.
  // Currently, access tokens are only refreshed if
  //   a) the session token is validated (i.e. user navigates to a protected endpoint), and
  //   b) the time until the token expires is less than SESSION_REISSUE_THRESHOLD (5 days).

  if (Date.now() >= session.expiresAt.getTime() - SESSION_REISSUE_THRESHOLD) {
    const newTokens = await arcticClient().refreshAccessToken(session.refreshToken);
    session.accessToken = newTokens.accessToken();
    session.refreshToken = newTokens.refreshToken();
    session.expiresAt = newTokens.accessTokenExpiresAt();

    await manager.db
      .updateTable('session')
      .set({
        access_token: session.accessToken,
        refresh_token: session.refreshToken,
        expires_at: session.expiresAt,
      })
      .where('session.id', '=', session.id)
      .executeTakeFirstOrThrow();
  }

  return { session, user };
}

// export async function getCurrentSession (): Promise<SessionValidationResult> {
//   const cookieJar = await cookies();
//   const token = cookieJar.get(SESSION_COOKIE_NAME)?.value ?? null;
//   if (token === null) {
//     return { session: null, user: null };
//   }
//   const result = await validateSessionToken(token);
//   return result;
// });

// export const requireSession = cache(
//   async (callback?: string): Promise<{ session: Session; user: User }> => {
//     const cookieJar = await cookies();
//     const token = cookieJar.get(SESSION_COOKIE_NAME)?.value ?? null;
//     if (token === null) {
//       throw redirect(`/login?callback=${callback}`);
//     }
//     const result = await validateSessionToken(token);
//     if (result.session === null) {
//       throw redirect(`/login?callback=${callback}`);
//     }
//     return result;
//   },
// );

export async function invalidateSession(sessionId: string) {
  // TODO: this would be great to prevent race conditions!
  // TODO: could be implemented whenever the database supports
  // TODO: the RETURNING clause (f.e. if migrating to MariaDB).
  // const token = await manager.db
  //   .deleteFrom('session')
  //   .where('session.id', '=', sessionId)
  //   .returning('access_token')
  //   .executeTakeFirst();
  const token = await manager.db
    .selectFrom('session')
    .select('access_token')
    .where('session.id', '=', sessionId)
    .executeTakeFirst();
  await manager.db.deleteFrom('session').where('session.id', '=', sessionId).execute();

  if (token?.access_token) {
    await arcticClient().revokeToken(token.access_token);
  }
}

export async function invalidateUserSessions(userId: string) {
  // TODO: this would be great to prevent race conditions!
  // TODO: could be implemented whenever the database supports
  // TODO: the RETURNING clause (f.e. if migrating to MariaDB).
  // const tokens = await manager.db
  //   .deleteFrom('session')
  //   .where('session.user_id', '=', userId)
  //   .returning('access_token')
  //   .execute();
  const tokens = await manager.db
    .selectFrom('session')
    .select('access_token')
    .where('session.user_id', '=', userId)
    .execute();
  await manager.db.deleteFrom('session').where('session.user_id', '=', userId).execute();

  for (const { access_token } of tokens) {
    await arcticClient().revokeToken(access_token);
  }
}

const SESSION_COOKIE_OPTS = {
  httpOnly: true,
  path: '/',
  secure: import.meta.env.PROD,
  sameSite: 'lax' as const,
};

export function setSessionTokenCookie(event: RequestEvent, token: string, expiresAt: Date): void {
  event.cookies.set(SESSION_COOKIE_NAME, token, { ...SESSION_COOKIE_OPTS, expires: expiresAt });
}

export async function deleteSessionTokenCookie(event: RequestEvent) {
  event.cookies.set(SESSION_COOKIE_NAME, '', { ...SESSION_COOKIE_OPTS, maxAge: 0 });
}

export interface DiscordInfo {
  /** the Discord ID of the user */
  id: string;
  accessToken: string;
  refreshToken: string;
  /** the Date the {@link accessToken} expires */
  expiresAt: Date;
}

export async function createSession(token: string, discordInfo: DiscordInfo): Promise<Session> {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  const session: Session = {
    id: sessionId,
    userId: discordInfo.id,
    accessToken: discordInfo.accessToken,
    refreshToken: discordInfo.refreshToken,
    expiresAt: discordInfo.expiresAt,
  };
  await manager.db
    .insertInto('session')
    .values({
      id: session.id,
      user_id: session.userId,
      access_token: session.accessToken,
      refresh_token: session.refreshToken,
      expires_at: session.expiresAt,
    })
    .execute();
  return session;
}

export async function generateSessionToken(): Promise<string> {
  const tokenBytes = new Uint8Array(20);
  crypto.getRandomValues(tokenBytes);
  const token = encodeBase32LowerCase(tokenBytes);
  return token;
}

/** An authenticated user's web session */
export interface Session {
  /** The (random) ID of the session */
  id: string;
  /** The session owner's Discord ID */
  userId: string;
  /**
   * The session owner's Discord OAuth Access Token.
   *
   * This token expires at {@link Session.expiresAt}, and can be refreshed using {@link Session.refreshToken}.
   */
  accessToken: string;
  /** The session owner's Discord OAuth Refresh Token */
  refreshToken: string;
  /**
   * The time this session is invalidated.
   *
   * This should be the SAME TIME as when the {@link Session.accessToken} expires.
   */
  expiresAt: Date;
}

type SessionValidationResult = { session: Session; user: User } | { session: null; user: null };
