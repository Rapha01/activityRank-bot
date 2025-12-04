import type { ShardDB } from '@activityrank/database';
import { type ExpressionBuilder, expressionBuilder } from 'kysely';
import { jsonBuildObject } from 'kysely/helpers/mysql';
import { getGuildHost } from '#models/guildRouteModel.ts';
import { shards } from '#models/shard.ts';

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

export async function getLevelfactor(guildId: string) {
  const host = await getGuildHost(guildId);

  const { db } = shards.get(host);

  const { levelFactor } = await db
    .selectFrom('guild')
    .select('levelFactor')
    .where('guildId', '=', guildId)
    .executeTakeFirstOrThrow();

  return levelFactor;
}

/**
 * ! COPIED from apps/bot/src/bot/models/rankModel.ts
 * Fetch the XP values of a specified member of a given guild.
 * @param guild The guild to fetch XP scores from.
 * @param userId The ID of the member whose XP scores are to be fetched.
 * @returns An object containing the XP totals for the member categorized by `alltime`, `year`, `month`, `week`, and `day`.
 * Does not throw if there is no member in the guild; instead, all stats are set to `0`.
 */
export async function fetchGuildMemberScores(guildId: string, userId: string) {
  const host = await getGuildHost(guildId);

  const { db } = shards.get(host);

  const auto = { alltime: 0, year: 0, month: 0, week: 0, day: 0 };

  const res = await db
    .selectFrom('guildMember')
    .select(['alltime', 'year', 'month', 'week', 'day'])
    .where('guildId', '=', guildId)
    .where('userId', '=', userId)
    .executeTakeFirst();

  return res ?? auto;
}

/**
 * ! COPIED from apps/bot/src/bot/models/rankModel.ts
 * Fetches various statistics of a specified member from a given guild.
 * Does not throw if the member is not in the guild - instead, it returns values of 0 for all stats.
 * @param guild The guild to fetch XP scores from.
 * @param userId The ID of the member whose XP scores are to be fetched.
 * @returns An object containing the statistic totals for the member categorized by `alltime`, `year`, `month`, `week`, and `day`.
 * If the member is not in the guild or if there are no statistics, values default to 0 for each category.
 */
export async function fetchGuildMemberStatistics(guildId: string, userId: string) {
  const host = await getGuildHost(guildId);

  const { db } = shards.get(host);

  const tables = ['textMessage', 'voiceMinute', 'vote', 'invite', 'bonus'] as const;
  const times = ['alltime', 'year', 'month', 'week', 'day'] as const;

  // SUM is required for textMessage and voiceMinute because their primary key is not entirely fulfilled:
  // textMessage and voiceMinute have the channelId attribute while the other statistics are scoped per-guild.
  const selectPartialPK = <T extends 'textMessage' | 'voiceMinute'>(
    table: T,
    eb: ExpressionBuilder<ShardDB, T>,
  ) => [
    `${table}.userId` as const,
    ...times.map((t) => eb.fn.sum<number>(`${table}.${t}`).as(`${table}_${t}`)),
  ];

  // For these tables, the primary key is fully satisfied so SUMming woud have no effect.
  // It's omitted to avoid obfuscating the purpose of the query.
  // Practically, its inclusion would not change the result of a query.
  const selectFullPK = <T extends 'vote' | 'invite' | 'bonus'>(
    table: T,
    eb: ExpressionBuilder<ShardDB, T>,
  ) => [
    `${table}.userId` as const,
    ...times.map((t) => eb.ref(`${table}.${t}`).as(`${table}_${t}`)),
  ];

  const validRowEB = expressionBuilder<ShardDB, StatType>();
  const validRow = validRowEB.and([
    validRowEB('guildId', '=', guildId),
    validRowEB('userId', '=', userId),
    validRowEB('alltime', '!=', validRowEB.lit(0)),
  ]);

  return await db
    .selectFrom(db.selectNoFrom((s) => s.val(userId).as('userId')).as('userIds'))
    .leftJoin(
      (eb) =>
        eb
          .selectFrom('textMessage')
          .select((eb) => selectPartialPK<'textMessage'>('textMessage', eb))
          .where(validRow)
          .as('textMessage'),
      (join) => join.onRef('userIds.userId', '=', 'textMessage.userId'),
    )
    .leftJoin(
      (eb) =>
        eb
          .selectFrom('voiceMinute')
          .select((eb) => selectPartialPK<'voiceMinute'>('voiceMinute', eb))
          .where(validRow)
          .as('voiceMinute'),
      (join) => join.onRef('userIds.userId', '=', 'voiceMinute.userId'),
    )
    .leftJoin(
      (eb) =>
        eb
          .selectFrom('vote')
          .select((eb) => selectFullPK<'vote'>('vote', eb))
          .where(validRow)
          .as('vote'),
      (join) => join.onRef('userIds.userId', '=', 'vote.userId'),
    )
    .leftJoin(
      (eb) =>
        eb
          .selectFrom('invite')
          .select((eb) => selectFullPK<'invite'>('invite', eb))
          .where(validRow)
          .as('invite'),
      (join) => join.onRef('userIds.userId', '=', 'invite.userId'),
    )
    .leftJoin(
      (eb) =>
        eb
          .selectFrom('bonus')
          .select((eb) => selectFullPK<'bonus'>('bonus', eb))
          .where(validRow)
          .as('bonus'),
      (join) => join.onRef('userIds.userId', '=', 'bonus.userId'),
    )
    .select((eb) =>
      tables.flatMap((table) =>
        jsonBuildObject({
          alltime: eb.fn.coalesce(`${table}_alltime`, eb.lit(0)),
          year: eb.fn.coalesce(`${table}_year`, eb.lit(0)),
          month: eb.fn.coalesce(`${table}_month`, eb.lit(0)),
          week: eb.fn.coalesce(`${table}_week`, eb.lit(0)),
          day: eb.fn.coalesce(`${table}_day`, eb.lit(0)),
        }).as(table),
      ),
    )
    .select('userIds.userId')
    .executeTakeFirstOrThrow();
}

// Copied from apps/bot/src/util/fct.ts
export function getLevelProgression(totalScore: number, levelFactor: number) {
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
