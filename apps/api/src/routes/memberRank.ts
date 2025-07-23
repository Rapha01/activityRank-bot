import { getRateLimiter } from '#util/ratelimit.js';
import { Error400, Error401, Error403, zInt, zSnowflake } from '#util/zod.js';
import { createRoute, z } from '@hono/zod-openapi';

const params = z
  .object({ guildId: zSnowflake, userId: zSnowflake })
  .openapi({ example: { guildId: '12345678901234567', userId: '774660568728469585' } });

const makeStatsObject = (type: string, verb: string) =>
  z.object({
    alltime: zInt.openapi({
      description: `The amount of ${type} the user has ${verb} since statistics were first tracked.`,
    }),
    year: zInt.openapi({
      description: `The amount of ${type} the user has ${verb} since Jan 1st of the current year`,
    }),
    month: zInt.openapi({
      description: `The amount of ${type} the user has ${verb} since the 1st of the current month`,
    }),
    week: zInt.openapi({
      description: `The amount of ${type} the user has ${verb} since the 1st day of the current week`,
    }),
    day: zInt.openapi({ description: `The amount of ${type} the user has ${verb} today` }),
  });

const responseSchema = z
  .object({
    userId: zSnowflake,
    alltime: zInt.openapi({ description: 'The XP of the user, since first tracked (or reset)' }),
    year: zInt.openapi({
      description: 'The XP the user has collected since Jan 1st of the current year',
    }),
    month: zInt.openapi({
      description: 'The XP the user has collected since the 1st of the current month',
    }),
    week: zInt.openapi({
      description: 'The XP the user has collected since the 1st day of the current week',
    }),
    day: zInt.openapi({ description: 'The XP the user has collected today' }),
    levelProgression: z
      .number()
      .min(1)
      .openapi({ description: 'The (fractional) current level of the user' }),
    level: zInt.openapi({ description: 'The (floored) current level of the user' }),
    textMessage: makeStatsObject('text messages', 'sent'),
    voiceMinute: makeStatsObject('minutes in voice chat', 'spent'),
    invite: makeStatsObject('inviters', 'been set as'),
    vote: makeStatsObject('votes', 'sent'),
    bonus: makeStatsObject('bonus XP', 'earned'),
  })
  .openapi({
    description: 'A user-statistic object.',
  });

export const memberRankRoute = createRoute({
  method: 'get',
  path: '/guilds/:guildId/member/:userId/rank',
  tags: ['v0'],
  summary: '/guilds/:guildId/member/:userId/rank',
  description: "Returns a description of a member's XP and statistic counts.",
  security: [{ publicBearerAuth: [] }],
  request: {
    params,
  },
  responses: {
    200: {
      description: 'Successful rank response',
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
  middleware: [getRateLimiter()] as const,
});
