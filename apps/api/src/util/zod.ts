import { z } from '@hono/zod-openapi';

export const zSnowflake = z
  .string()
  .regex(/^\d{17,20}$/)
  .openapi({
    description:
      'A Discord ["Snowflake"](https://discord.com/developers/docs/reference#snowflakes), represented as a string.',
    example: '905898879785005106',
  })
  .openapi('Snowflake');

export const zInt = z.number().int();

const zError = <C extends number>(code: C) =>
  z.object({
    code: z.literal(code),
    message: z.string(),
  });

export const zError400 = zError(400).openapi('400Response');

export const Error400 = {
  description: 'Failed to parse the request.',
  content: {
    'application/json': {
      schema: zError400,
    },
  },
} as const;

export const zError401 = zError(401).openapi('401Response');

export const Error401 = {
  description: 'Unauthorized request.',
  content: {
    'application/json': {
      schema: zError401,
    },
  },
} as const;

export const zError403 = zError(403).openapi('403Response');

export const Error403 = {
  description: 'Forbidden.',
  content: {
    'application/json': {
      schema: zError403,
    },
  },
} as const;
