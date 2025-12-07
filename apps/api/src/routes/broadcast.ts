import z from 'zod/v4';
import { createInternalRoute } from '#util/routes.ts';
import { Error400, Error401, Error403 } from '#util/zod.ts';

export const broadcastRoute = createInternalRoute({
  method: 'post',
  path: '/broadcast/*',
  summary: '/broadcast/[...path]',
  description: 'Forwards a POST request to all bot modules',
  responses: {
    200: {
      description: 'Successfully recieved responses',
      content: {
        'application/json': {
          schema: z.array(
            z.union([
              z.object({ ok: z.literal(false), shardId: z.int(), info: z.string().optional() }),
              z.object({ ok: z.literal(true), shardId: z.int(), data: z.unknown() }),
            ]),
          ),
        },
      },
    },
    400: Error400,
    401: Error401,
    403: Error403,
  },
});
