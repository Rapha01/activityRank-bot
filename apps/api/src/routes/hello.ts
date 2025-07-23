import type { Responses } from '#util/types.js';
import { createRoute } from '@hono/zod-openapi';
import { z } from 'zod';

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

export const helloRoute = createRoute({
  method: 'get',
  path: '/hello',
  tags: ['v0'],
  summary: '/hello',
  description: 'Just says hi! Useful to check authentication.',
  security: [{ publicBearerAuth: [] }],
  responses,
});
