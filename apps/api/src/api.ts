import { zValidator } from '@hono/zod-validator';
import { HTTPException } from 'hono/http-exception';
import { Hono, type Context, type Env } from 'hono';
import { rateLimiter } from 'hono-rate-limiter';
import { describeRoute } from 'hono-openapi';
import { resolver, validator } from 'hono-openapi/zod';
import { z } from 'zod';

import { PublicAPIAuth, type PublicAPIAuthVariables } from '#middleware/auth.js';
import { zSnowflake } from '#util/zod.js';
import { getGuildMemberRanks } from '#services/ranks.js';
import { topMembers } from '#schemas/topMembers.js';

export const apiRouter = new Hono<{ Variables: PublicAPIAuthVariables }>();
apiRouter.use(PublicAPIAuth);

apiRouter.get(
  '/hello',
  describeRoute({
    summary: '/hello',
    description: 'Just says hi! Useful to check authentication.',
    security: [{ publicBearerAuth: [] }],
    responses: {
      200: {
        description: 'Successful response',
        content: {
          'text/plain': {
            schema: resolver(z.literal('Hiya!').openapi({ example: 'Hiya!' })),
          },
        },
      },
      400: {
        $ref: '#/components/responses/InvalidAuthError',
      },
      401: {
        $ref: '#/components/responses/UnauthorizedError',
      },
    },
  }),
  (c) => {
    return c.body('Hiya!');
  },
);

const keyGenerator = (c: Context<Env, '/'>) => {
  const header = c.req.header('Authorization');
  if (!header) {
    throw new Error('Unauthorised ratelimit fn');
  }
  return header;
};

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

apiRouter.get(
  '/guilds/:guildId/members/top',
  describeRoute({
    summary: '/guilds/{guildId}/members/top',
    description: "Returns entries describing members' XP and statistic counts.",
    security: [{ publicBearerAuth: [] }],
    responses: {
      200: {
        description: 'Successful toplist response',
        content: {
          'application/json': {
            schema: resolver(topMembers.response),
          },
        },
      },
    },
  }),
  validator(
    'param',
    z.object({ guildId: zSnowflake }).openapi({ example: { guildId: '12345678901234567' } }),
  ),
  validator('query', topMembers.query),
  rateLimiter({ windowMs: 10_000, limit: 10, keyGenerator }),
  async (c) => {
    const { guildId } = c.req.valid('param');
    const { 'top-rank': topRank, size, time, 'stat-type': statType } = c.req.valid('query');

    if (guildId !== c.get('authorisedGuildId')) {
      throw new HTTPException(403, { message: 'Inconsistent Guild IDs' });
    }

    return c.json(await getGuildMemberRanks(guildId, time, statType, topRank, topRank + size));
  },
);
