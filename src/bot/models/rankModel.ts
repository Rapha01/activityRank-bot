import shardDb, { getShardDb } from '../../models/shardDb/shardDb.js';
import fct from '../../util/fct.js';
import type { Guild } from 'discord.js';
import type { StatTimeInterval, StatType } from 'models/types/enums.js';
import { getGuildModel, type GuildModel } from './guild/guildModel.js';
import type { ExpressionBuilder } from 'kysely';
import type { ShardDB } from 'models/types/kysely/shard.js';
import { jsonBuildObject } from 'kysely/helpers/mysql';

// Toplist
export const getGuildMemberRanks = async function <T extends StatTimeInterval>(
  guild: Guild,
  type: StatType | 'totalScore',
  time: T,
  from: number,
  to: number,
) {
  const cachedGuild = await getGuildModel(guild);

  const memberRanksSql = `
    SELECT * FROM ${getGuildMemberRanksSql(cachedGuild, guild.id)} AS memberranks
    ORDER BY ${type + time} DESC 
    LIMIT ${from - 1},${to - (from - 1)}`;

  type RankResult = Record<`${StatType | 'totalScore'}${StatTimeInterval}`, number> & {
    userId: string;
  };

  const ranks = await shardDb.query<RankResult[]>(cachedGuild.dbHost, memberRanksSql);

  return ranks.map((r) => ({
    ...r,
    levelProgression: fct.getLevelProgression(r.totalScoreAlltime, cachedGuild.db.levelFactor),
  }));
};

// All scores for one member
export const getGuildMemberRank = async function (guild: Guild, userId: string) {
  const cachedGuild = await getGuildModel(guild);

  const res = await shardDb.query<
    Record<`${StatType | 'totalScore'}${StatTimeInterval}`, number>[]
  >(
    cachedGuild.dbHost,
    `SELECT * FROM ${getGuildMemberRankSql(cachedGuild, guild.id, userId)} AS memberrank`,
  );

  if (res.length == 0) return null;

  return res[0];
};

/**
 * Retrieve the rank of a single member in the guild, ranked by total XP over a given time period.
 * @returns The rank of the specified member: `1` represents the member with the most XP over the given time period.
 */
export async function getGuildMemberScorePosition(
  guild: Guild,
  userId: string,
  time: StatTimeInterval_V2,
) {
  const cachedGuild = await getGuildModel(guild);

  const db = getShardDb(cachedGuild.dbHost);

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
  const { count } = await db
    .selectFrom([myRank, guildRanks])
    .select((eb) => eb.fn.countAll<number>().as('count'))
    .whereRef('guild_ranks.score', '>', 'member_rank.score')
    .executeTakeFirstOrThrow();

  // make it 1-indexed
  return count + 1;
}

/**
 * Retrieve the rank of a single member in the guild, ranked by a given statistic over a given time period.
 * @returns The rank of the specified member: `1` represents the member with the most instances of the statistic over the given time period.
 */
export async function getGuildMemberStatPosition(
  guild: Guild,
  userId: string,
  statistic: StatType,
  time: StatTimeInterval_V2,
) {
  const cachedGuild = await getGuildModel(guild);

  const db = getShardDb(cachedGuild.dbHost);

  const myRank = db
    .selectFrom(statistic)
    .select(`${time} as count`)
    .where('guildId', '=', guild.id)
    .where('userId', '=', userId)
    .as('member_rank');
  const guildRanks = db
    .selectFrom(statistic)
    .select(`${time} as count`)
    .where('guildId', '=', guild.id)
    .as('guild_ranks');

  // SELECT COUNT of all ranks where their rank > this member's rank
  const { count } = await db
    .selectFrom([myRank, guildRanks])
    .select((eb) => eb.fn.countAll<number>().as('count'))
    .whereRef('guild_ranks.count', '>', 'member_rank.count')
    .executeTakeFirstOrThrow();

  // make it 1-indexed
  return count + 1;
}

// Most active channels within a guild
export const getChannelRanks = async function <T extends StatTimeInterval>(
  guild: Guild,
  type: 'voiceMinute' | 'textMessage',
  time: T,
  from: number,
  to: number,
) {
  const { dbHost } = await getGuildModel(guild);

  const ranks = await shardDb.query<({ channelId: string } & Record<T, number>)[]>(
    dbHost,
    `SELECT channelId,
    SUM(${time}) AS ${time} FROM ${type}
    WHERE guildId = ${guild.id} AND alltime != 0 GROUP BY channelId
    ORDER BY ${time} DESC LIMIT ${from - 1},${to - (from - 1)}`,
  );
  return ranks;
};

// Most active Members of a specific channel
export const getChannelMemberRanks = async <T extends StatTimeInterval>(
  guild: Guild,
  channelId: string,
  type: StatType,
  time: T,
  from: number,
  to: number,
) => {
  const { dbHost } = await getGuildModel(guild);

  const ranks = await shardDb.query<({ userId: string } & Record<T, number>)[]>(
    dbHost,
    `SELECT userId,${time} FROM ${type}
          WHERE guildId = ${guild.id} AND channelId = ${channelId} AND alltime != 0
          ORDER BY ${time} DESC 
          LIMIT ${from - 1},${to - (from - 1)}`,
  );
  return ranks;
};

// Most active channels of a certain member
export const getGuildMemberTopChannels = async function <T extends StatTimeInterval>(
  guild: Guild,
  userId: string,
  type: StatType,
  time: T,
  from: number,
  to: number,
) {
  const { dbHost } = await getGuildModel(guild);

  const res = await shardDb.query<({ channelId: string } & Record<T, number>)[]>(
    dbHost,
    `SELECT channelId,${time} FROM ${type}
          WHERE guildId = ${guild.id} AND userId = ${userId} AND ${time} != 0
          ORDER BY ${time} DESC
          LIMIT ${from - 1},${to - (from - 1)}`,
  );

  if (res.length == 0) return null;

  return res;
};

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
  const cachedGuild = await getGuildModel(guild);
  const db = getShardDb(cachedGuild.dbHost);

  const result = await db
    .selectFrom('guildMember')
    .select('alltime')
    .where('guildId', '=', guild.id)
    .where('userId', '=', userId)
    .executeTakeFirst();

  return result?.alltime ?? 0;
}

function getGuildMemberRanksSql(guildCache: GuildModel, guildId: string) {
  const voiceranksSql = `(SELECT userId,
      SUM(alltime) AS voiceMinuteAlltime,
      SUM(year) AS voiceMinuteYear,
      SUM(month) AS voiceMinuteMonth,
      SUM(week) AS voiceMinuteWeek,
      SUM(day) AS voiceMinuteDay
      FROM voiceMinute WHERE guildId = ${guildId} AND alltime != 0
      GROUP BY userId) AS voiceranks`;
  const textranksSql = `(SELECT userId,
      SUM(alltime) AS textMessageAlltime,
      SUM(year) AS textMessageYear,
      SUM(month) AS textMessageMonth,
      SUM(week) AS textMessageWeek,
      SUM(day) AS textMessageDay
      FROM textMessage WHERE guildId = ${guildId} AND alltime != 0
      GROUP BY userId) AS textranks`;
  const voteranksSql = `(SELECT userId,
      alltime AS voteAlltime,
      year AS voteYear,
      month AS voteMonth,
      week AS voteWeek,
      day AS voteDay
      FROM vote WHERE guildId = ${guildId} AND alltime != 0) AS voteranks`;
  const inviteranksSql = `(SELECT userId,
      alltime AS inviteAlltime,
      year AS inviteYear,
      month AS inviteMonth,
      week AS inviteWeek,
      day AS inviteDay
      FROM invite WHERE guildId = ${guildId} AND alltime != 0) AS inviteranks`;
  const bonusranksSql = `(SELECT userId,
      alltime AS bonusAlltime,
      year AS bonusYear,
      month AS bonusMonth,
      week AS bonusWeek,
      day AS bonusDay
      FROM bonus WHERE guildId = ${guildId} AND alltime != 0) AS bonusranks`;
  const memberIdsSql = `((SELECT userId FROM voiceMinute WHERE guildId = ${guildId} AND alltime != 0)
      UNION (SELECT userId FROM textMessage WHERE guildId = ${guildId} AND alltime != 0)
      UNION (SELECT userId FROM vote WHERE guildId = ${guildId} AND alltime != 0)
      UNION (SELECT userId FROM bonus WHERE guildId = ${guildId} AND alltime != 0)) AS userIds`;

  const memberRanksRawSql = `(SELECT
      userIds.userId AS userId,
      IFNULL(voiceMinuteAlltime,0) * ${guildCache.db.xpPerVoiceMinute} AS voiceMinuteScoreAlltime,
      IFNULL(voiceMinuteYear,0) * ${guildCache.db.xpPerVoiceMinute} AS voiceMinuteScoreYear,
      IFNULL(voiceMinuteMonth,0) * ${guildCache.db.xpPerVoiceMinute} AS voiceMinuteScoreMonth,
      IFNULL(voiceMinuteWeek,0) * ${guildCache.db.xpPerVoiceMinute} AS voiceMinuteScoreWeek,
      IFNULL(voiceMinuteDay,0) * ${guildCache.db.xpPerVoiceMinute} AS voiceMinuteScoreDay,
      IFNULL(textMessageAlltime,0) * ${guildCache.db.xpPerTextMessage} AS textMessageScoreAlltime,
      IFNULL(textMessageYear,0) * ${guildCache.db.xpPerTextMessage} AS textMessageScoreYear,
      IFNULL(textMessageMonth,0) * ${guildCache.db.xpPerTextMessage} AS textMessageScoreMonth,
      IFNULL(textMessageWeek,0) * ${guildCache.db.xpPerTextMessage} AS textMessageScoreWeek,
      IFNULL(textMessageDay,0) * ${guildCache.db.xpPerTextMessage} AS textMessageScoreDay,
      IFNULL(voteAlltime,0) * ${guildCache.db.xpPerVote} AS voteScoreAlltime,
      IFNULL(voteYear,0) * ${guildCache.db.xpPerVote} AS voteScoreYear,
      IFNULL(voteMonth,0) * ${guildCache.db.xpPerVote} AS voteScoreMonth,
      IFNULL(voteWeek,0) * ${guildCache.db.xpPerVote} AS voteScoreWeek,
      IFNULL(voteDay,0) * ${guildCache.db.xpPerVote} AS voteScoreDay,
      IFNULL(inviteAlltime,0) * ${guildCache.db.xpPerInvite} AS inviteScoreAlltime,
      IFNULL(inviteYear,0) * ${guildCache.db.xpPerInvite} AS inviteScoreYear,
      IFNULL(inviteMonth,0) * ${guildCache.db.xpPerInvite} AS inviteScoreMonth,
      IFNULL(inviteWeek,0) * ${guildCache.db.xpPerInvite} AS inviteScoreWeek,
      IFNULL(inviteDay,0) * ${guildCache.db.xpPerInvite} AS inviteScoreDay,
      IFNULL(bonusAlltime,0) * ${guildCache.db.xpPerBonus} AS bonusScoreAlltime,
      IFNULL(bonusYear,0) * ${guildCache.db.xpPerBonus} AS bonusScoreYear,
      IFNULL(bonusMonth,0) * ${guildCache.db.xpPerBonus} AS bonusScoreMonth,
      IFNULL(bonusWeek,0) * ${guildCache.db.xpPerBonus} AS bonusScoreWeek,
      IFNULL(bonusDay,0) * ${guildCache.db.xpPerBonus} AS bonusScoreDay,
      IFNULL(voiceMinuteAlltime,0) AS voiceMinuteAlltime,
      IFNULL(voiceMinuteYear,0) AS voiceMinuteYear,
      IFNULL(voiceMinuteMonth,0) AS voiceMinuteMonth,
      IFNULL(voiceMinuteWeek,0) AS voiceMinuteWeek,
      IFNULL(voiceMinuteDay,0) AS voiceMinuteDay,
      IFNULL(textMessageAlltime,0) AS textMessageAlltime,
      IFNULL(textMessageYear,0) AS textMessageYear,
      IFNULL(textMessageMonth,0) AS textMessageMonth,
      IFNULL(textMessageWeek,0) AS textMessageWeek,
      IFNULL(textMessageDay,0) AS textMessageDay,
      IFNULL(voteAlltime,0) AS voteAlltime,
      IFNULL(voteYear,0) AS voteYear,
      IFNULL(voteMonth,0) AS voteMonth,
      IFNULL(voteWeek,0) AS voteWeek,
      IFNULL(voteDay,0) AS voteDay,
      IFNULL(inviteAlltime,0) AS inviteAlltime,
      IFNULL(inviteYear,0) AS inviteYear,
      IFNULL(inviteMonth,0) AS inviteMonth,
      IFNULL(inviteWeek,0) AS inviteWeek,
      IFNULL(inviteDay,0) AS inviteDay,
      IFNULL(bonusAlltime,0) AS bonusAlltime,
      IFNULL(bonusYear,0) AS bonusYear,
      IFNULL(bonusMonth,0) AS bonusMonth,
      IFNULL(bonusWeek,0) AS bonusWeek,
      IFNULL(bonusDay,0) AS bonusDay
      FROM ${memberIdsSql}
      LEFT JOIN ${voiceranksSql} ON userIds.userId = voiceranks.userId
      LEFT JOIN ${textranksSql} ON userIds.userId = textranks.userId
      LEFT JOIN ${voteranksSql} ON userIds.userId = voteranks.userId
      LEFT JOIN ${inviteranksSql} ON userIds.userId = inviteranks.userId
      LEFT JOIN ${bonusranksSql} ON userIds.userId = bonusranks.userId) AS memberranksraw`;

  const memberRanksSql = `(SELECT memberranksraw.*,
      (voiceMinuteScoreAlltime + textMessageScoreAlltime + voteScoreAlltime + inviteScoreAlltime + bonusScoreAlltime) AS totalScoreAlltime,
      (voiceMinuteScoreYear + textMessageScoreYear + voteScoreYear + inviteScoreYear + bonusScoreYear) AS totalScoreYear,
      (voiceMinuteScoreMonth + textMessageScoreMonth + voteScoreMonth + inviteScoreMonth + bonusScoreMonth) AS totalScoreMonth,
      (voiceMinuteScoreWeek + textMessageScoreWeek + voteScoreWeek + inviteScoreWeek + bonusScoreWeek) AS totalScoreWeek,
      (voiceMinuteScoreDay + textMessageScoreDay + voteScoreDay + inviteScoreDay + bonusScoreDay) AS totalScoreDay FROM ${memberRanksRawSql})`;

  return memberRanksSql;
}

function getGuildMemberRankSql(guildCache: GuildModel, guildId: string, userId: string) {
  const voicerankSql = `(SELECT userId,
        SUM(alltime) AS voiceMinuteAlltime,
        SUM(year) AS voiceMinuteYear,
        SUM(month) AS voiceMinuteMonth,
        SUM(week) AS voiceMinuteWeek,
        SUM(day) AS voiceMinuteDay
        FROM voiceMinute WHERE guildId = ${guildId} AND userId = ${userId} AND alltime != 0
        GROUP BY userId) AS voicerank`;
  const textrankSql = `(SELECT userId,
        SUM(alltime) AS textMessageAlltime,
        SUM(year) AS textMessageYear,
        SUM(month) AS textMessageMonth,
        SUM(week) AS textMessageWeek,
        SUM(day) AS textMessageDay
        FROM textMessage WHERE guildId = ${guildId} AND userId = ${userId} AND alltime != 0
        GROUP BY userId) AS textrank`;
  const voterankSql = `(SELECT userId,
        alltime AS voteAlltime,
        year AS voteYear,
        month AS voteMonth,
        week AS voteWeek,
        day AS voteDay
        FROM vote WHERE guildId = ${guildId} AND userId = ${userId} AND alltime != 0) AS voterank`;
  const inviterankSql = `(SELECT userId,
        alltime AS inviteAlltime,
        year AS inviteYear,
        month AS inviteMonth,
        week AS inviteWeek,
        day AS inviteDay
        FROM invite WHERE guildId = ${guildId} AND userId = ${userId} AND alltime != 0) AS inviterank`;
  const bonusrankSql = `(SELECT userId,
        alltime AS bonusAlltime,
        year AS bonusYear,
        month AS bonusMonth,
        week AS bonusWeek,
        day AS bonusDay
        FROM bonus WHERE guildId = ${guildId} AND userId = ${userId} AND alltime != 0) AS bonusrank`;
  const memberIdSql = `(SELECT '${userId}' AS userId) AS userIds`;

  const memberRankRawSql = `(SELECT
      userIds.userId AS userId,
      IFNULL(voiceMinuteAlltime,0) * ${guildCache.db.xpPerVoiceMinute} AS voiceMinuteScoreAlltime,
      IFNULL(voiceMinuteYear,0) * ${guildCache.db.xpPerVoiceMinute} AS voiceMinuteScoreYear,
      IFNULL(voiceMinuteMonth,0) * ${guildCache.db.xpPerVoiceMinute} AS voiceMinuteScoreMonth,
      IFNULL(voiceMinuteWeek,0) * ${guildCache.db.xpPerVoiceMinute} AS voiceMinuteScoreWeek,
      IFNULL(voiceMinuteDay,0) * ${guildCache.db.xpPerVoiceMinute} AS voiceMinuteScoreDay,
      IFNULL(textMessageAlltime,0) * ${guildCache.db.xpPerTextMessage} AS textMessageScoreAlltime,
      IFNULL(textMessageYear,0) * ${guildCache.db.xpPerTextMessage} AS textMessageScoreYear,
      IFNULL(textMessageMonth,0) * ${guildCache.db.xpPerTextMessage} AS textMessageScoreMonth,
      IFNULL(textMessageWeek,0) * ${guildCache.db.xpPerTextMessage} AS textMessageScoreWeek,
      IFNULL(textMessageDay,0) * ${guildCache.db.xpPerTextMessage} AS textMessageScoreDay,
      IFNULL(voteAlltime,0) * ${guildCache.db.xpPerVote} AS voteScoreAlltime,
      IFNULL(voteYear,0) * ${guildCache.db.xpPerVote} AS voteScoreYear,
      IFNULL(voteMonth,0) * ${guildCache.db.xpPerVote} AS voteScoreMonth,
      IFNULL(voteWeek,0) * ${guildCache.db.xpPerVote} AS voteScoreWeek,
      IFNULL(voteDay,0) * ${guildCache.db.xpPerVote} AS voteScoreDay,
      IFNULL(inviteAlltime,0) * ${guildCache.db.xpPerInvite} AS inviteScoreAlltime,
      IFNULL(inviteYear,0) * ${guildCache.db.xpPerInvite} AS inviteScoreYear,
      IFNULL(inviteMonth,0) * ${guildCache.db.xpPerInvite} AS inviteScoreMonth,
      IFNULL(inviteWeek,0) * ${guildCache.db.xpPerInvite} AS inviteScoreWeek,
      IFNULL(inviteDay,0) * ${guildCache.db.xpPerInvite} AS inviteScoreDay,
      IFNULL(bonusAlltime,0) * ${guildCache.db.xpPerBonus} AS bonusScoreAlltime,
      IFNULL(bonusYear,0) * ${guildCache.db.xpPerBonus} AS bonusScoreYear,
      IFNULL(bonusMonth,0) * ${guildCache.db.xpPerBonus} AS bonusScoreMonth,
      IFNULL(bonusWeek,0) * ${guildCache.db.xpPerBonus} AS bonusScoreWeek,
      IFNULL(bonusDay,0) * ${guildCache.db.xpPerBonus} AS bonusScoreDay,
      IFNULL(voiceMinuteAlltime,0) AS voiceMinuteAlltime,
      IFNULL(voiceMinuteYear,0) AS voiceMinuteYear,
      IFNULL(voiceMinuteMonth,0) AS voiceMinuteMonth,
      IFNULL(voiceMinuteWeek,0) AS voiceMinuteWeek,
      IFNULL(voiceMinuteDay,0) AS voiceMinuteDay,
      IFNULL(textMessageAlltime,0) AS textMessageAlltime,
      IFNULL(textMessageYear,0) AS textMessageYear,
      IFNULL(textMessageMonth,0) AS textMessageMonth,
      IFNULL(textMessageWeek,0) AS textMessageWeek,
      IFNULL(textMessageDay,0) AS textMessageDay,
      IFNULL(voteAlltime,0) AS voteAlltime,
      IFNULL(voteYear,0) AS voteYear,
      IFNULL(voteMonth,0) AS voteMonth,
      IFNULL(voteWeek,0) AS voteWeek,
      IFNULL(voteDay,0) AS voteDay,
      IFNULL(inviteAlltime,0) AS inviteAlltime,
      IFNULL(inviteYear,0) AS inviteYear,
      IFNULL(inviteMonth,0) AS inviteMonth,
      IFNULL(inviteWeek,0) AS inviteWeek,
      IFNULL(inviteDay,0) AS inviteDay,
      IFNULL(bonusAlltime,0) AS bonusAlltime,
      IFNULL(bonusYear,0) AS bonusYear,
      IFNULL(bonusMonth,0) AS bonusMonth,
      IFNULL(bonusWeek,0) AS bonusWeek,
      IFNULL(bonusDay,0) AS bonusDay
      FROM ${memberIdSql}
      LEFT JOIN ${voicerankSql} ON userIds.userId = voicerank.userId
      LEFT JOIN ${textrankSql} ON userIds.userId = textrank.userId
      LEFT JOIN ${voterankSql} ON userIds.userId = voterank.userId
      LEFT JOIN ${inviterankSql} ON userIds.userId = inviterank.userId
      LEFT JOIN ${bonusrankSql} ON userIds.userId = bonusrank.userId) AS memberrankraw`;

  const memberRankSql = `(SELECT memberrankraw.*,
      (voiceMinuteScoreAlltime + textMessageScoreAlltime + voteScoreAlltime + inviteScoreAlltime + bonusScoreAlltime) AS totalScoreAlltime,
      (voiceMinuteScoreYear + textMessageScoreYear + voteScoreYear + inviteScoreYear + bonusScoreYear) AS totalScoreYear,
      (voiceMinuteScoreMonth + textMessageScoreMonth + voteScoreMonth + inviteScoreMonth + bonusScoreMonth) AS totalScoreMonth,
      (voiceMinuteScoreWeek + textMessageScoreWeek + voteScoreWeek + inviteScoreWeek + bonusScoreWeek) AS totalScoreWeek,
      (voiceMinuteScoreDay + textMessageScoreDay + voteScoreDay + inviteScoreDay + bonusScoreDay) AS totalScoreDay FROM ${memberRankRawSql})`;

  return memberRankSql;
}
