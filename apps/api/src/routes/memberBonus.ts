import { z } from '@hono/zod-openapi';
import { createPublicAuthRoute } from '#util/routes.ts';
import { zInt, zSnowflake } from '#util/zod.ts';

const params = z
  .object({ guildId: zSnowflake, userId: zSnowflake })
  .openapi({ example: { guildId: '12345678901234567', userId: '774660568728469585' } });

export const memberBonusRoute = createPublicAuthRoute({
  method: 'patch', //?
  path: '/guilds/:guildId/member/:userId/bonus',
  summary: '/guilds/:guildId/member/:userId/bonus',
  description: 'Give or take bonus XP to/from a member.',
  request: {
    params,
    body: {
      content: {
        'application/json': {
          schema: z
            .object({
              delta: zInt.min(-100_000).max(100_000).openapi({
                description:
                  'The amount of XP to give to the user. May be negative to remove bonus XP. Overall bonus XP may be negative.',
              }),
            })
            .openapi({
              examples: [{ delta: 10 }, { delta: -2000 }],
            }),
        },
      },
    },
  },
  responses: {
    204: {
      description: 'Successfully applied bonus XP',
    },
  },
});
