import { getGuildHost } from '#models/guildRouteModel.js';
import { shards } from '#models/shard.js';
import type { ExpressionBuilder } from 'kysely';
import type { ShardDB } from '@activityrank/database';

/**
 * ! COPIED from apps/bot/src/bot/models/rankModel.ts
 * Fetch the XP and statistic values of a range of members in a given guild, over a given timespan.
 * The returned members will be sorted by the provided `type`.
 *
 * @returns An array of objects containing the XP and statistic totals for each member.
 */
export async function getGuildMemberRanks(
  guildId: string,
  time: TimePeriod,
  type: StatType | 'totalScore',
  from: number,
  to: number,
) {
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

  const { levelFactor } = await db
    .selectFrom('guild')
    .select('levelFactor')
    .where('guildId', '=', guildId)
    .executeTakeFirstOrThrow();

  return ranks.map((r) => {
    const levelProgression = getLevelProgression(r.totalScore, levelFactor);
    return {
      ...r,
      levelProgression,
      level: Math.floor(levelProgression),
    };
  });
}

// Copied from apps/bot/src/util/fct.ts
function getLevelProgression(totalScore: number, levelFactor: number) {
  function solve(a: number, b: number, c: number) {
    const result = (-1 * b + Math.sqrt(b ** 2 - 4 * a * c)) / (2 * a);
    const result2 = (-1 * b - Math.sqrt(b ** 2 - 4 * a * c)) / (2 * a);

    if (result >= 0) return result;
    if (result2 >= 0) return result2;
    return null;
  }

  return (solve(levelFactor / 2, levelFactor / 2 + 100, -totalScore) ?? 0) + 1;
}

export type StatType = 'textMessage' | 'voiceMinute' | 'invite' | 'vote' | 'bonus';
export type TimePeriod = 'alltime' | 'day' | 'week' | 'month' | 'year';
