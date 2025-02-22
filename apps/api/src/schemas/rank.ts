import { zInt, zSnowflake } from '#util/zod.js';
import { z } from 'zod';

const statsObject = (type: string, verb: string) =>
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

const rankResponseSchema = z
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
    textMessage: statsObject('text messages', 'sent'),
    voiceMinute: statsObject('minutes in voice chat', 'spent'),
    invite: statsObject('inviters', 'been set as'),
    vote: statsObject('votes', 'sent'),
    bonus: statsObject('bonus XP', 'earned'),
  })
  .openapi({
    description: 'A user-statistic object.',
  });

export const rank = { response: rankResponseSchema };
