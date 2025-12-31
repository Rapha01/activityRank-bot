import z from 'zod/v4';
import { createInternalRoute } from '#util/routes.ts';
import { Error400, Error401, Error403, zSnowflake } from '#util/zod.ts';

export const sharedGuildsRoute = createInternalRoute({
  method: 'post',
  path: '/shared-guilds',
  summary: '/shared-guilds',
  description: 'Gets all guilds which the both the specified user and bot are part of.',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({ userId: zSnowflake, userGuildIds: z.array(zSnowflake) }).openapi({
            example: { userId: '774660568728469585', userGuildIds: ['12345678901234567', '...'] },
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Successfully found guilds',
      content: {
        'application/json': {
          schema: z.object({
            guilds: z.array(
              z.object({
                id: zSnowflake,
                name: z.string(),
                isMember: z.literal(true),
                permission: z.enum(['OWNER', 'ADMINISTRATOR', 'MODERATOR', 'MEMBER']),
                icon: z.string().nullable(),
                banner: z.string().nullable(),
              }),
            ),
            complete: z.boolean().openapi({
              description:
                'If this is false, one or more of the shards could not be reached and so data may be inaccurate.',
            }),
          }),
        },
      },
    },
    400: Error400,
    401: Error401,
    403: Error403,
  },
});
