import { z } from '@hono/zod-openapi';
import { createPublicAuthRoute } from '#util/routes.ts';
import type { Responses } from '#util/types.ts';

const responses: Responses = {
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
};

export const helloRoute = createPublicAuthRoute(
  {
    method: 'get',
    path: '/hello',
    summary: '/hello',
    description: 'Just says hi! Useful to check authentication.',
    responses,
  },
  { ratelimit: { enabled: false } },
);
