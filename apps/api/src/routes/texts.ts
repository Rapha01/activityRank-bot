import { z } from '@hono/zod-openapi';
import { createInternalRoute } from '#util/routes.js';
import { Error400, Error401, Error403 } from '#util/zod.js';

const responseSchema = z.object({
  commands: z.record(
    z.string(),
    z.object({
      title: z.string(),
      desc: z.string(),
      subdesc: z.string(),
      subcommands: z.array(
        z.object({
          title: z.string(),
          command: z.string(),
          desc: z.string(),
          example: z.string(),
        }),
      ),
    }),
  ),
  faqs: z.array(
    z.object({
      id: z.number().int(),
      title: z.string(),
      desc: z.string(),
    }),
  ),
  patchnotes: z.array(
    z.object({
      version: z.string(),
      date: z.string(),
      time: z.string(),
      title: z.string(),
      desc: z.string(),
      features: z.array(z.object({ title: z.string(), desc: z.string() })),
      fixes: z.array(z.object({ title: z.string(), desc: z.string() })),
    }),
  ),
});

export const textsRoute = createInternalRoute({
  method: 'get',
  path: '/texts',
  summary: '/texts',
  description: 'Returns constant text data, like patchnotes and frequenly asked questions.',
  responses: {
    200: {
      description: 'Successful text response',
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
