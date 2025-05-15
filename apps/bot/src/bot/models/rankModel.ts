import type { ShardDB } from '@activityrank/database';
import { shards } from '../../models/shardDb/shardDb.js';
import fct from '../../util/fct.js';
import type { Guild } from 'discord.js';
import type { StatTimeInterval, StatType } from '#models/types/enums.js';
import { getGuildModel } from './guild/guildModel.js';
import { expressionBuilder, type ExpressionBuilder } from 'kysely';
import { jsonBuildObject } from 'kysely/helpers/mysql';

/**
 * Fetch the XP and statistic values of a range of members in a given guild, over a given timespan.
 * The returned members will be sorted by the provided `type`.
 *
 * @returns An array of objects containing the XP and statistic totals for each member.
 */
export async function getGuildMemberRanks(
  guild: Guild,
  type: StatType | 'totalScore',
  time: StatTimeInterval,
  from: number,
  to: number,
) {
  const cachedGuild = await getGuildModel(guild);

  const { db } = shards.get(cachedGuild.dbHost);

  const makeUnionSelect = (table: StatType, eb: ExpressionBuilder<ShardDB, never>) =>
    eb
      .selectFrom(table)
      .select('userId')
      .where('guildId', '=', guild.id)
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
          .where('guildId', '=', guild.id)
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
          .where('guildId', '=', guild.id)
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
          .where('guildId', '=', guild.id)
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
          .where('guildId', '=', guild.id)
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
          .where('guildId', '=', guild.id)
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
          .where('guildId', '=', guild.id)
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
    levelProgression: fct.getLevelProgression(r.totalScore, cachedGuild.db.levelFactor),
  }));
}

/**
 * Fetch the XP values of a specified member of a given guild.
 * @param guild The guild to fetch XP scores from.
 * @param userId The ID of the member whose XP scores are to be fetched.
 * @returns An object containing the XP totals for the member categorized by `alltime`, `year`, `month`, `week`, and `day`.
 * Does not throw if there is no member in the guild; instead, all stats are set to `0`.
 */
export async function fetchGuildMemberScores(guild: Guild, userId: string) {
  const cachedGuild = await getGuildModel(guild);

  const { db } = shards.get(cachedGuild.dbHost);

  const auto = { alltime: 0, year: 0, month: 0, week: 0, day: 0 };

  const res = await db
    .selectFrom('guildMember')
    .select(['alltime', 'year', 'month', 'week', 'day'])
    .where('guildId', '=', guild.id)
    .where('userId', '=', userId)
    .executeTakeFirst();

  return res ?? auto;
}

/**
 * Fetches various statistics of a specified member from a given guild.
 * Does not throw if the member is not in the guild - instead, it returns values of 0 for all stats.
 * @param guild The guild to fetch XP scores from.
 * @param userId The ID of the member whose XP scores are to be fetched.
 * @returns An object containing the statistic totals for the member categorized by `alltime`, `year`, `month`, `week`, and `day`.
 * If the member is not in the guild or if there are no statistics, values default to 0 for each category.
 */
export async function fetchGuildMemberStatistics(guild: Guild, userId: string) {
  const cachedGuild = await getGuildModel(guild);

  const { db } = shards.get(cachedGuild.dbHost);

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
    validRowEB('guildId', '=', guild.id),
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

/**
 * Retrieve the rank of a single member in the guild, ranked by total XP over a given time period.
 * @returns The rank of the specified member: `1` represents the member with the most XP over the given time period.
 *  Returns `null` if the amount of XP is zero.
 */
export async function getGuildMemberScorePosition(
  guild: Guild,
  userId: string,
  time: StatTimeInterval,
): Promise<number | null> {
  const cachedGuild = await getGuildModel(guild);

  const { db } = shards.get(cachedGuild.dbHost);

  const myRank = db
    .selectFrom('guildMember')
    .select(`${time} as score`)
    .where('guildId', '=', guild.id)
    .where('userId', '=', userId)
    .as('member_rank');
  const guildRanks = db
    .selectFrom('guildMember')
    .select(`${time} as score`)
    .where('guildId', '=', guild.id)
    .as('guild_ranks');

  // SELECT COUNT of all ranks where their rank > this member's rank
  const selectCount = db
    .selectFrom([myRank, guildRanks])
    // `count` is returned as a string - presumably because it could be a bigint.
    .select((eb) => eb.fn.countAll<string>().as('count'))
    .whereRef('guild_ranks.score', '>', 'member_rank.score')
    .as('score');

  const { count, member_score } = await db
    .selectFrom([myRank, selectCount])
    .select((eb) => [
      'score.count',
      /* 
        member_score returns either:
          a) the amount of XP held by the member
          b) if that value is NULL, `coalesce` makes the result equal to `-1`.
        This is necessary because comparing numbers and NULLs (via < or >) always returns NULL.

        For instance, if `member_rank.score` was NULL (because there is no member_rank; 
        they haven't ever generated XP), comparing `guild_ranks.score > member_rank.score` returns 1.
        Number.parseInt(null) produces 0, and so users with no score at all have a rank of `#1`.
        */
      eb.fn
        .coalesce('member_rank.score', eb.lit(-1))
        .as('member_score'),
    ])
    .executeTakeFirstOrThrow();

  if (typeof member_score === 'number' || member_score < 1) {
    // If the member_score is either 0 or NULL, return `null`
    return null;
  }

  // make it 1-indexed
  return Number.parseInt(count) + 1;
}

/**
 * Retrieve the rank of a single member in the guild, ranked by a given statistic over a given time period.
 * @returns The rank of the specified member: `1` represents the member with the most instances of the statistic over the given time period.
 *  Returns `null` if the statistic in the category is zero.
 */
export async function getGuildMemberStatPosition(
  guild: Guild,
  userId: string,
  statistic: StatType,
  time: StatTimeInterval,
): Promise<number | null> {
  const cachedGuild = await getGuildModel(guild);

  const { db } = shards.get(cachedGuild.dbHost);

  const myRank = db
    .selectFrom(statistic)
    .select((eb) => eb.fn.sum(time).as('count'))
    .where('guildId', '=', guild.id)
    .where('userId', '=', userId)
    .as('member_rank');
  const guildRanks = db
    .selectFrom(statistic)
    .select((eb) => eb.fn.sum(time).as('count'))
    .where('guildId', '=', guild.id)
    .groupBy('userId')
    .as('guild_ranks');

  // SELECT COUNT of all ranks where their rank > this member's rank
  const selectCount = db
    .selectFrom([myRank, guildRanks])
    // `count` is returned as a string - presumably because it could be a bigint.
    .select((eb) => eb.fn.countAll<string>().as('count'))
    .whereRef('guild_ranks.count', '>', 'member_rank.count')
    .as('count');

  const { count, member_count } = await db
    .selectFrom([myRank, selectCount])
    .select((eb) => [
      'count.count',
      /* 
        member_count returns either:
          a) the count of the statistic held by the member
          b) if that statistic is NULL, `coalesce` makes the result equal to `-1`.
        This is necessary because comparing numbers and NULLs (via < or >) always returns NULL.

        For instance, if `member_rank.count` was NULL (because there is no member_rank; 
        they haven't ever created the requested statistic), comparing `guild_ranks.count > member_rank.count` returns 1.
        Number.parseInt(null) produces 0, and so users with no statistic at all have a rank of `#1`.
      */
      eb.fn
        .coalesce('member_rank.count', eb.lit(-1))
        .as('member_count'),
    ])
    .executeTakeFirstOrThrow();

  // If the member_count is either 0 or NULL, return `null`
  if (typeof member_count === 'number' || member_count < 1) {
    return null;
  }

  // make it 1-indexed
  return Number.parseInt(count) + 1;
}

/**
 * Retrieves the channels with the most activity of a given type: either `voiceMinute` or `textMessage`.
 *
 * @returns An array of {channelId, total} objects, sorted in descending order.
 */
export async function getChannelRanks(
  guild: Guild,
  type: 'voiceMinute' | 'textMessage',
  time: StatTimeInterval,
  from: number,
  to: number,
) {
  const { dbHost } = await getGuildModel(guild);
  const { db } = shards.get(dbHost);

  return await db
    .selectFrom(type)
    .where('guildId', '=', guild.id)
    .where('alltime', '!=', 0)
    .groupBy('channelId')
    .select((eb) => ['channelId', eb.fn.sum<number>(time).as('total')])
    .orderBy('total desc')
    .offset(from - 1)
    .limit(to - (from - 1))
    .execute();
}

/**
 * Retrieves the members that have been most active in a specified channel.
 *
 * @returns An array of {channelId, total} objects, sorted in descending order.
 */
export async function getChannelMemberRanks(
  guild: Guild,
  channelId: string,
  type: StatType,
  time: StatTimeInterval,
  from: number,
  to: number,
) {
  const cachedGuild = await getGuildModel(guild);

  return await shards
    .get(cachedGuild.dbHost)
    .db.selectFrom(type)
    .where('guildId', '=', guild.id)
    .where('channelId', '=', channelId)
    .where('alltime', '!=', 0)
    .orderBy(`${time} desc`)
    .offset(from - 1)
    .limit(to - (from - 1))
    .select(['userId', `${time} as total`])
    .execute();
}

/**
 * Retrieves the channels of a given type the specified member has been most active in.
 *
 * @returns An array of {channelId, entries} objects, sorted in descending order.
 */
export async function getGuildMemberTopChannels(
  guild: Guild,
  userId: string,
  type: StatType,
  time: StatTimeInterval,
  from: number,
  to: number,
) {
  const { dbHost } = await getGuildModel(guild);

  return await shards
    .get(dbHost)
    .db.selectFrom(type)
    .where('guildId', '=', guild.id)
    .where('userId', '=', userId)
    .where(time, '!=', 0)
    .orderBy(`${time} desc`)
    .offset(from - 1)
    .limit(to - (from - 1))
    .select(['channelId', `${time} as entries`])
    .execute();
}

/**
 * Retrieves the total XP accumulated by a specified member in a given guild.
 *
 * This function queries the database for the member's total XP (`alltime`) within the specified guild.
 * If no record is found for the member, the function returns `0` as the default value.
 *
 * @param guild - The guild from which to fetch the XP data.
 * @param userId - The ID of the member whose total XP is to be retrieved.
 * @returns The total XP accumulated by the member. If no record is found, this resolves to `0`.
 */
export async function fetchMemberTotalXp(guild: Guild, userId: string) {
  const { dbHost } = await getGuildModel(guild);

  const result = await shards
    .get(dbHost)
    .db.selectFrom('guildMember')
    .select('alltime')
    .where('guildId', '=', guild.id)
    .where('userId', '=', userId)
    .executeTakeFirst();

  return result?.alltime ?? 0;
}
