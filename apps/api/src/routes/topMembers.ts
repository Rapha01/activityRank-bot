import { z } from '@hono/zod-openapi';
import { createPublicAuthRoute } from '#util/routes.ts';
import { Error400, Error401, Error403, zInt, zSnowflake } from '#util/zod.ts';

const querySchema = z.object({
  'top-rank': z.coerce.number().int().min(1).default(1).openapi({
    description:
      'The lowest-numbered (and therefore most XP-having) rank to query. Returns `size` entries below this rank.',
  }),
  size: z.coerce.number().int().min(1).max(50).default(10).openapi({
    description:
      'The maximum number of entries that will be returned. _Please prefer to set this value high (up to its maximum of 50) rather than sending multiple queries._',
  }),
  time: z.enum(['alltime', 'day', 'week', 'month', 'year']).default('alltime').openapi({
    description:
      "The period of time the statistics will be returned for. \n* `day` returns today's statistics. \n* `week` returns this week's statistics. \n* `month` returns statistics since the 1st of the month.\n* `year` returns statistics since the first day of the year. \n* `alltime` will simply return all statistics.",
  }),
  'stat-type': z
    .enum(['textMessage', 'voiceMinute', 'invite', 'vote', 'bonus', 'totalScore'])
    .default('totalScore')
    .openapi({
      description:
        'The desired statistic to sort the leaderboard by. All statistics will be returned regardless of this selection.',
    }),
});

const responseSchema = z
  .array(
    z.object({
      userId: zSnowflake,
      alltime: zInt.openapi({
        description: 'The XP score of the user for alltime (regardless of the `time` parameter)',
      }),
      totalScore: zInt.openapi({
        description: 'The XP score of the user over the given `time` parameter',
      }),
      textMessage: zInt.openapi({ description: 'The number of text messages the user has sent' }),
      voiceMinute: zInt.openapi({
        description: 'The number of minutes the user has been in voice chats',
      }),
      vote: zInt.openapi({ description: 'The number of votes the user has recieved' }),
      invite: zInt.openapi({
        description: 'The number of other users the user has invited to the server',
      }),
      bonus: zInt.openapi({
        description: 'The amount of bonus XP the user has been given by admins or bonustime',
      }),
      levelProgression: z.number().min(1).openapi({
        description: 'The (fractional) current level of the user',
      }),
      level: zInt.openapi({
        description: 'The (floored) current level of the user',
      }),
    }),
  )
  .openapi({
    maxLength: 50,
    description:
      'An array of user-statistic objects, ordered by their rank.\nThe first entry in the array corrresponds with the `top-rank` query parameter.',
  });

export const topMembersRoute = createPublicAuthRoute({
  method: 'get',
  path: '/guilds/:guildId/members/top',
  summary: '/guilds/:guildId/members/top',
  description: "Returns entries describing members' XP and statistic counts.",
  request: {
    params: z
      .object({ guildId: zSnowflake })
      .openapi({ example: { guildId: '12345678901234567' } }),
    query: querySchema,
  },
  responses: {
    200: {
      description: 'Successful toplist response',
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
