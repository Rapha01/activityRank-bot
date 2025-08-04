import { z } from '@hono/zod-openapi';
import { createInternalRoute } from '#util/routes.js';
import { Error400, Error401, Error403 } from '#util/zod.js';

const responseSchema = z.object({
  stats: z.array(
    z.object({
      status: z
        .number()
        .int()
        .openapi({
          description: 'The current status of the shard. `0` (`Ready`) is preferred.',
          externalDocs: {
            url: 'https://discord.js.org/docs/packages/discord.js/14.21.0/WebSocketManager:Class#status',
            description:
              'The `Status` enum is a Discord.JS-specific concept, representing the state the websocket manager is in. See also: https://discord.js.org/docs/packages/discord.js/14.21.0/Status:Enum',
          },
        }),
      shardId: z.number().int().min(0).openapi({
        description: 'The ID of the shard. (Shard 0 manages all DMs and Entitlements).',
      }),
      ip: z.string().openapi({
        description: 'An IP address the shard is exposed on.',
        example: '127.0.0.2:3020',
      }),
      serverCount: z
        .number()
        .int()
        .openapi({ description: 'The number of servers the shard manages.' }),
      uptimeSeconds: z.number().int().openapi({ example: 1030 }),
      readyDate: z.date(),
      changedHealthDate: z.date(),
    }),
  ),
});

export const shardStatsRoute = createInternalRoute({
  method: 'get',
  path: '/shards/stats',
  summary: '/shards/stats',
  description: "Returns statistics for the bot's shards.",
  responses: {
    200: {
      description: 'Successful statistics response',
      content: {
        'application/json': {
          schema: responseSchema,
        },
      },
    },
    400: Error400,
    401: Error401,
    403: Error403,
  },
});
