import { z } from 'zod';

export const zSnowflake = z
  .string()
  .regex(/^\d{17,20}$/)
  .openapi({
    description:
      'A Discord ["Snowflake"](https://discord.com/developers/docs/reference#snowflakes), represented as a string.',
    ref: 'Snowflake',
    example: '905898879785005106',
  });

export const zInt = z.number().int();
