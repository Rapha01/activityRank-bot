import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import type { Context, Env } from 'hono';
import { rateLimiter } from 'hono-rate-limiter';

import { PublicAPIAuth, type PublicAPIAuthVariables } from '#middleware/auth.js';
import { Error400, Error401, Error403, zSnowflake } from '#util/zod.js';
import { getGuildMemberRanks } from '#services/ranks.js';
import { topMembers } from '#schemas/topMembers.js';
import { JSONHTTPException } from '#util/errors.js';

export const apiRouter = new OpenAPIHono<{ Variables: PublicAPIAuthVariables }>();
apiRouter.use(PublicAPIAuth);

const helloRoute = createRoute({
  method: 'get',
  path: '/hello',
  description: 'Just says hi! Useful to check authentication.',
  security: [{ publicBearerAuth: [] }],
  responses: {
    200: {
      description: 'Successful response',
      content: {
        'text/plain': {
          schema: z.string().openapi({
            example: 'Hi!\n\nYour authentication for guild "123456789012345678" is valid.',
          }),
        },
      },
    },
    400: Error400,
    401: Error401,
  },
});

apiRouter.openapi(helloRoute, ({ text, get }) => {
  return text(`Hi!\n\nYour authentication for guild "${get('authorisedGuildId')}" is valid.`, 200);
});

const keyGenerator = (c: Context<Env, '/'>) => {
  const header = c.req.header('Authorization');
  if (!header) {
    throw new Error('Unauthorised ratelimit fn');
  }
  return header;
};

const topRoute = createRoute({
  method: 'get',
  path: '/guilds/:guildId/members/top',
  description: "Returns entries describing members' XP and statistic counts.",
  security: [{ publicBearerAuth: [] }],
  request: {
    params: z
      .object({ guildId: zSnowflake })
      .openapi({ example: { guildId: '12345678901234567' } }),
    query: topMembers.query,
  },
  responses: {
    200: {
      description: 'Successful toplist response',
      content: {
        'application/json': {
          schema: topMembers.response,
        },
      },
    },
    400: Error400,
    401: Error401,
    403: Error403,
  },
  middleware: [rateLimiter({ windowMs: 10_000, limit: 10, keyGenerator })] as const,
});

apiRouter.openapi(topRoute, async (c) => {
  const { guildId } = c.req.valid('param');
  const { 'top-rank': topRank, size, time, 'stat-type': statType } = c.req.valid('query');

  if (guildId !== c.get('authorisedGuildId')) {
    throw new JSONHTTPException(403, 'Inconsistent Guild IDs');
  }

  return c.json(await getGuildMemberRanks(guildId, time, statType, topRank, topRank + size), 200);
});

/*
apiRouter.get(
  '/guilds/:guildId/member/:userId/rank',
  zValidator('param', z.object({ guildId: zSnowflake, userId: zSnowflake })),
  (c) => {
    const { guildId, userId } = c.req.valid('param');

    if (guildId !== c.get('authorisedGuildId')) {
      throw new HTTPException(403, { message: 'Inconsistent Guild IDs' });
    }

    return c.body('Not Yet Implemented...');
  },
);
 */
