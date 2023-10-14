import shardDb from '../../../models/shardDb/shardDb.js';
import mysql from 'promise-mysql';
import rankModel from '../rankModel.js';
import type { Guild, GuildMember } from 'discord.js';
import type { guildMember } from 'models/types/shard.js';
import type { PropertiesOfType } from 'models/types/generics.js';

const promises = new Map<string, Promise<void>>();

const cachedFields = ['notifyLevelupDm', 'reactionVote'] as const;
let defaultCache: CachedGuildMember | null = null;
let defaultAll: guildMember | null = null;

export type CachedGuildMember = Pick<guildMember, (typeof cachedFields)[number]> & {
  totalXp: number;
  totalScore: number;
  lastVoteDate: Date | null;
  lastTextMessageDate: Date | null;
  lastMessageChannelId: string | null;
};

export const cache = {
  load: (member: GuildMember) => {
    if (!member.appData) {
      const promiseKey = `${member.guild.id}.${member.id}`;
      if (promises.has(promiseKey)) {
        return promises.get(promiseKey)!;
      }

      promises.set(
        `${member.guild.id}.${member.id}`,
        new Promise(async (resolve, reject) => {
          try {
            await buildCache(member);
            promises.delete(promiseKey);
            resolve();
          } catch (e) {
            promises.delete(promiseKey);
            reject(e);
          }
        }),
      );

      return promises.get(promiseKey)!;
    }

    return new Promise<void>(async (resolve) => resolve());
  },
};

export const storage = {
  get: async (guild: Guild, userId: string) => {
    const res = await shardDb.query<guildMember[]>(
      guild.appData.dbHost,
      `SELECT * FROM guildMember WHERE guildId = ${guild.id} && userId = ${mysql.escape(userId)}`,
    );

    if (res.length == 0) {
      if (!defaultAll)
        defaultAll = (
          await shardDb.query<guildMember[]>(
            guild.appData.dbHost,
            `SELECT * FROM guildMember WHERE guildId = 0 AND userId = 0`,
          )
        )[0];
      return defaultAll;
    } else return res[0];
  },

  set: async <K extends Exclude<keyof CachedGuildMember, 'guildId' | 'userId'>>(
    guild: Guild,
    userId: string,
    field: K,
    value: CachedGuildMember[K],
  ) => {
    await shardDb.query(
      guild.appData.dbHost,
      `INSERT INTO guildMember (guildId,userId,${field}) VALUES (${guild.id},${mysql.escape(
        userId,
      )},${mysql.escape(value)}) ON DUPLICATE KEY UPDATE ${field} = ${mysql.escape(value)}`,
    );

    const member = guild.members.cache.get(userId);
    if (member && member.appData && (cachedFields as readonly string[]).indexOf(field) > -1)
      member.appData[field] = value;
  },

  increment: async <K extends keyof PropertiesOfType<CachedGuildMember, number>>(
    guild: Guild,
    userId: string,
    field: K,
    value: number,
  ) => {
    await shardDb.query(
      guild.appData.dbHost,
      `INSERT INTO guildMember (guildId,userId,${field}) VALUES (${guild.id},${mysql.escape(
        userId,
      )},${mysql.escape(value)}) ON DUPLICATE KEY UPDATE ${field} = ${field} + ${mysql.escape(
        value,
      )}`,
    );

    const member = guild.members.cache.get(userId);
    if (member && member.appData && (cachedFields as readonly string[]).indexOf(field) > -1)
      member.appData[field] += value * 1;
  },
};

export async function getRankedUserIds(guild: Guild) {
  const textmessageUserIds = await shardDb.query<{ userId: string }[]>(
    guild.appData.dbHost,
    `SELECT DISTINCT userId FROM textMessage WHERE guildId = ${guild.id} AND alltime != 0`,
  );
  const voiceMinuteUserIds = await shardDb.query<{ userId: string }[]>(
    guild.appData.dbHost,
    `SELECT DISTINCT userId FROM voiceMinute WHERE guildId = ${guild.id} AND alltime != 0`,
  );
  const voteUserIds = await shardDb.query<{ userId: string }[]>(
    guild.appData.dbHost,
    `SELECT DISTINCT userId FROM vote WHERE guildId = ${guild.id} AND alltime != 0`,
  );
  const bonusUserIds = await shardDb.query<{ userId: string }[]>(
    guild.appData.dbHost,
    `SELECT DISTINCT userId FROM bonus WHERE guildId = ${guild.id} AND alltime != 0`,
  );

  const ids = [
    ...new Set([...textmessageUserIds, ...voiceMinuteUserIds, ...voteUserIds, ...bonusUserIds]),
  ];

  let userIds = [];
  for (let id of ids) {
    userIds.push(id.userId);
  }

  return userIds;
}

const buildCache = async (member: GuildMember) => {
  let foundCache = await shardDb.query<CachedGuildMember[]>(
    member.guild.appData.dbHost,
    `SELECT ${cachedFields.join(',')} FROM guildMember WHERE guildId = ${
      member.guild.id
    } AND userId = ${member.id}`,
  );

  let cache;

  if (foundCache.length > 0) cache = foundCache[0];
  else {
    if (!defaultCache) await loadDefaultCache(member.guild.appData.dbHost);
    cache = Object.assign({}, defaultCache);
  }

  cache.totalXp = (await rankModel.getGuildMemberTotalScore(member.guild, member.id)) ?? 0;
  cache.lastTextMessageDate = null;

  member.appData = cache;
};

const loadDefaultCache = async (dbHost: string) => {
  let res = await shardDb.query<CachedGuildMember[]>(
    dbHost,
    `SELECT ${cachedFields.join(',')} FROM guildMember WHERE guildId = 0 AND userId = 0`,
  );

  if (res.length == 0)
    await shardDb.query(dbHost, `INSERT IGNORE INTO guildMember (guildId,userId) VALUES (0,0)`);

  res = await shardDb.query(
    dbHost,
    `SELECT ${cachedFields.join(',')} FROM guildMember WHERE guildId = 0 AND userId = 0`,
  );

  defaultCache = res[0];
};

export default {
  cache,
  storage,
  getRankedUserIds,
};
