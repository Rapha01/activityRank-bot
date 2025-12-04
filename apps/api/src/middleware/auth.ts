/* 
  =================================== CONCEPTS ===================================
 * Each API key is assigned to a guild and only manageable by that guild's owner.
 * Keys are generated via a command (/api create-token) in the support server.
 * Formatted `ar-guildid-token`: `ar-905898879785005106-p8gf707vftwzowe67h4h8ji7`.
 * SHA256 hashes are stored in the database in 64-char hex format.
 * Keys are only disclosed once, to the creator.
 * A key can be checked by 
 *  a) hashing the token segment (SHA256)
 *  b) comparing the hash to the database
 * 
 * Internal tokens are much simpler - format is just `Bearer <config.keys.managerApiAuth>`
 * Internal tokens are used by the bot module to request data from the manager.
 */

import { subtle } from 'node:crypto';
import { createMiddleware } from 'hono/factory';
import { keys } from '#const/config.ts';
import { getGuildHost } from '#models/guildRouteModel.ts';
import { shards } from '#models/shard.ts';
import { JSONHTTPException } from '#util/errors.ts';

const PREFIX = 'Bearer';
const HEADER = 'Authorization';
const HEADER_RE = new RegExp(`^${PREFIX} ([A-Za-z0-9-]+) *$`);
const PUBLIC_TOKEN_RE = /^ar-(?<guildId>\d{17,20})-(?<token>[a-z0-9-]{24})$/;

export type PublicAPIAuthVariables = {
  authorisedGuildId: string;
};

// Based loosely on https://github.com/honojs/hono/blob/main/src/middleware/bearer-auth/index.ts
export const PublicAPIAuth = createMiddleware<{ Variables: PublicAPIAuthVariables }>(
  async (c, next) => {
    const headerToken = c.req.header(HEADER);
    if (!headerToken) {
      // No Authorization header
      throw new JSONHTTPException(401, 'No Authorization header provided');
    }
    const headerMatch = HEADER_RE.exec(headerToken);
    if (!headerMatch) {
      // Incorrectly formatted Authorization header
      throw new JSONHTTPException(400, 'Invalid Authorization Header');
    }

    const tokenMatch = PUBLIC_TOKEN_RE.exec(headerMatch[1]);
    if (!tokenMatch?.groups?.guildId || !tokenMatch?.groups?.token) {
      // Incorrectly formatted authorization token
      throw new JSONHTTPException(400, 'Invalid Authorization Token');
    }
    const guildId = tokenMatch.groups.guildId;
    const token = tokenMatch.groups.token;

    const host = await getGuildHost(guildId);
    const guild = await shards
      .get(host)
      .db.selectFrom('guild')
      .select('apiToken')
      .where('guildId', '=', guildId)
      .executeTakeFirst();

    if (!guild?.apiToken) {
      // This guild's API is disabled
      throw new JSONHTTPException(400, 'Guild API is disabled');
    }

    const hashedToken = await sha256(token);
    const equal = await timingSafeEqual(hashedToken, guild.apiToken);

    if (!equal) {
      // Invalid Token
      throw new JSONHTTPException(401, 'Invalid Token');
    }

    c.set('authorisedGuildId', guildId);

    await next();
  },
);

export const InternalAPIAuth = createMiddleware(async (c, next) => {
  const headerToken = c.req.header(HEADER);
  if (!headerToken) {
    // No Authorization header
    throw new JSONHTTPException(401, 'No Authorization header provided');
  }
  const headerMatch = HEADER_RE.exec(headerToken);
  if (!headerMatch) {
    // Incorrectly formatted Authorization header
    throw new JSONHTTPException(400, 'Invalid Authorization Header');
  }

  const token = headerMatch[1];

  const equal = await timingSafeEqual(token, keys.managerApiAuth);

  if (!equal) {
    // Invalid Token
    throw new JSONHTTPException(401, 'Invalid Token');
  }

  await next();
});

// https://github.com/honojs/hono/blob/2ead4d8faa58d187bf7ec74bac2160bab882eab0/src/utils/buffer.ts#L29
async function timingSafeEqual(a: string, b: string) {
  const [sa, sb] = await Promise.all([sha256(a), sha256(b)]);
  return sa === sb && a === b;
}

// https://github.com/honojs/hono/blob/2ead4d8faa58d187bf7ec74bac2160bab882eab0/src/utils/crypto.ts#L33
// NOTE: must be kept in sync with apps/bot/src/bot/commandsAdmin/api.ts
// always returns a 64-char long hex string, given a token
async function sha256(data: string): Promise<string> {
  const sourceBuffer = new TextEncoder().encode(data);
  const buffer = await subtle.digest({ name: 'SHA-256' }, sourceBuffer);
  const hash = Array.prototype.map
    .call(new Uint8Array(buffer), (x) => `00${x.toString(16)}`.slice(-2))
    .join('');
  return hash;
}
