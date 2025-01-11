import { PublicAPIAuth, type PublicAPIAuthVariables } from '#middleware/auth.js';
import { Hono, type Context, type Env } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { shards } from '#models/shard.js';
import { getGuildHost } from '#models/guildRouteModel.js';
import type { ExpressionBuilder } from 'kysely';
import type { ShardDB } from '@activityrank/database';
import { HTTPException } from 'hono/http-exception';
import { rateLimiter } from 'hono-rate-limiter';

const zSnowflake = z.string().regex(/^\d{17,20}$/);

export const apiRouter = new Hono<{ Variables: PublicAPIAuthVariables }>();
apiRouter.use(PublicAPIAuth);

apiRouter.get('/hello', (c) => {
  return c.body('Hiya!');
});

const keyGenerator = (c: Context<Env, '/'>) => {
  const header = c.req.header('Authorization');
  if (!header) {
    throw new Error('Unauthorised ratelimit fn');
  }
  return header;
};

apiRouter.get(
  '/guilds/:guildId/member/:userId/rank',
  zValidator('param', z.object({ guildId: zSnowflake, userId: zSnowflake })),
  (c) => {
    const { guildId, userId } = c.req.valid('param');

    if (guildId !== c.get('authorisedGuildId')) {
      throw new HTTPException(403, { message: 'Inconsistent Guild IDs' });
    }

    return c.body('Not Yet Implemented...');
  },
);

apiRouter.get(
  '/guilds/:guildId/members/top',
  zValidator('param', z.object({ guildId: zSnowflake })),
  zValidator(
    'query',
    z.object({
      'top-rank': z.coerce.number().int().min(1).default(1),
      size: z.coerce.number().int().min(1).max(50).default(10),
    }),
  ),
  rateLimiter({ windowMs: 10_000, limit: 10, keyGenerator }),
  async (c) => {
    const { guildId } = c.req.valid('param');
    const { 'top-rank': topRank, size } = c.req.valid('query');

    if (guildId !== c.get('authorisedGuildId')) {
      throw new HTTPException(403, { message: 'Inconsistent Guild IDs' });
    }

    return c.json(await getGuildMemberRanks(guildId, topRank, topRank + size));
  },
);

/**
 * ! COPIED from apps/bot/src/bot/models/rankModel.ts
 * Fetch the XP and statistic values of a range of members in a given guild, over a given timespan.
 * The returned members will be sorted by the provided `type`.
 *
 * @returns An array of objects containing the XP and statistic totals for each member.
 */
async function getGuildMemberRanks(guildId: string, from: number, to: number) {
  const type = 'totalScore';
  const time = 'alltime';
  const host = await getGuildHost(guildId);

  const { db } = shards.get(host);

  const makeUnionSelect = (table: StatType, eb: ExpressionBuilder<ShardDB, never>) =>
    eb
      .selectFrom(table)
      .select('userId')
      .where('guildId', '=', guildId)
      .where('alltime', '!=', eb.lit(0));

  const ranks = await db
    .selectFrom((eb) =>
      makeUnionSelect('textMessage', eb)
        .union(makeUnionSelect('voiceMinute', eb))
        .union(makeUnionSelect('vote', eb))
        .union(makeUnionSelect('invite', eb))
        .union(makeUnionSelect('bonus', eb))
        .as('userIds'),
    )
    .leftJoin(
      (eb) =>
        eb
          .selectFrom('textMessage')
          // See fetchGuildMemberStatistics for an explanation as to only the textMessage and voiceMinute columns use SUM.
          .select((eb) => ['userId', eb.fn.sum<number>(time).as('value')])
          .where('guildId', '=', guildId)
          .where('alltime', '!=', eb.lit(0))
          .groupBy('userId')
          .as('textMessage'),
      (join) => join.onRef('userIds.userId', '=', 'textMessage.userId'),
    )
    .leftJoin(
      (eb) =>
        eb
          .selectFrom('voiceMinute')
          .select((eb) => ['userId', eb.fn.sum<number>(time).as('value')])
          .where('guildId', '=', guildId)
          .where('alltime', '!=', eb.lit(0))
          .groupBy('userId')
          .as('voiceMinute'),
      (join) => join.onRef('userIds.userId', '=', 'voiceMinute.userId'),
    )
    .leftJoin(
      (eb) =>
        eb
          .selectFrom('vote')
          .select(['userId', `${time} as value`])
          .where('guildId', '=', guildId)
          .where('alltime', '!=', eb.lit(0))
          .groupBy('userId')
          .as('vote'),
      (join) => join.onRef('userIds.userId', '=', 'vote.userId'),
    )
    .leftJoin(
      (eb) =>
        eb
          .selectFrom('invite')
          .select(['userId', `${time} as value`])
          .where('guildId', '=', guildId)
          .where('alltime', '!=', eb.lit(0))
          .groupBy('userId')
          .as('invite'),
      (join) => join.onRef('userIds.userId', '=', 'invite.userId'),
    )
    .leftJoin(
      (eb) =>
        eb
          .selectFrom('bonus')
          .select(['userId', `${time} as value`])
          .where('guildId', '=', guildId)
          .where('alltime', '!=', eb.lit(0))
          .groupBy('userId')
          .as('bonus'),
      (join) => join.onRef('userIds.userId', '=', 'bonus.userId'),
    )
    .leftJoin(
      (eb) =>
        eb
          .selectFrom('guildMember')
          .select(['userId', 'alltime', `${time} as totalScore`])
          .where('guildId', '=', guildId)
          .where('alltime', '!=', eb.lit(0))
          .as('total'),
      (join) => join.onRef('userIds.userId', '=', 'total.userId'),
    )
    .select((eb) => [
      'userIds.userId',
      eb.fn.coalesce('total.alltime', eb.lit(0)).as('alltime'),
      eb.fn.coalesce('total.totalScore', eb.lit(0)).as('totalScore'),
      eb.fn.coalesce('textMessage.value', eb.lit(0)).as('textMessage'),
      eb.fn.coalesce('voiceMinute.value', eb.lit(0)).as('voiceMinute'),
      eb.fn.coalesce('vote.value', eb.lit(0)).as('vote'),
      eb.fn.coalesce('invite.value', eb.lit(0)).as('invite'),
      eb.fn.coalesce('bonus.value', eb.lit(0)).as('bonus'),
    ])
    .orderBy(`${type} desc`)
    .offset(from - 1)
    .limit(to - (from - 1))
    .execute();

  return ranks.map((r) => ({
    ...r,
    // levelProgression: fct.getLevelProgression(r.totalScore, cachedGuild.db.levelFactor),
  }));
}

type StatType = 'textMessage' | 'voiceMinute' | 'invite' | 'vote' | 'bonus';
