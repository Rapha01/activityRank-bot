import shardDb from '../../../models/shardDb/shardDb.js';
import mysql from 'promise-mysql';
import type { Guild, GuildMember } from 'discord.js';
import type { GuildMemberSchema } from 'models/types/shard.js';
import type { PropertiesOfType } from 'models/types/generics.js';
import guildModel from './guildModel.js';

const cachedFields = ['notifyLevelupDm', 'reactionVote'] as const;
let defaultCache: CachedDbFields | null = null;
let defaultAll: GuildMemberSchema | null = null;

type CachedDbFields = Pick<GuildMemberSchema, (typeof cachedFields)[number]>;

interface MemberCacheStorage {
  totalXp?: number;
  totalScore?: number;
  lastVoteDate?: Date | null;
  lastTextMessageDate?: Date | null;
  lastStatCommandDate?: Date | null;
  lastMessageChannelId?: string | null;
}

export interface CachedGuildMember {
  db: CachedDbFields;
  cache: MemberCacheStorage;
}

export const memberCache = new WeakMap<GuildMember, CachedGuildMember>();

export const cache = {
  get: async function (member: GuildMember): Promise<CachedGuildMember> {
    console.log('getting member', memberCache.has(member));
    if (memberCache.has(member)) return memberCache.get(member)!;
    return await buildCache(member);
  },
};

function isCachableDbKey(key: keyof GuildMemberSchema): key is keyof CachedDbFields {
  return cachedFields.includes(key as keyof CachedDbFields);
}

export const storage = {
  get: async (guild: Guild, userId: string) => {
    const { dbHost } = await guildModel.cache.get(guild);
    const res = await shardDb.query<GuildMemberSchema[]>(
      dbHost,
      `SELECT * FROM guildMember WHERE guildId = ${guild.id} && userId = ${mysql.escape(userId)}`,
    );

    if (res.length == 0) {
      if (!defaultAll)
        defaultAll = (
          await shardDb.query<GuildMemberSchema[]>(
            dbHost,
            `SELECT * FROM guildMember WHERE guildId = 0 AND userId = 0`,
          )
        )[0];
      return defaultAll;
    } else return res[0];
  },

  set: async <K extends Exclude<keyof GuildMemberSchema, 'guildId' | 'userId'>>(
    guild: Guild,
    userId: string,
    field: K,
    value: GuildMemberSchema[K],
  ) => {
    const { dbHost } = await guildModel.cache.get(guild);

    await shardDb.query(
      dbHost,
      `INSERT INTO guildMember (guildId,userId,${field}) VALUES (${guild.id},${mysql.escape(
        userId,
      )},${mysql.escape(value)}) ON DUPLICATE KEY UPDATE ${field} = ${mysql.escape(value)}`,
    );

    const member = guild.members.cache.get(userId);
    if (member) {
      const cachedMember = await cache.get(member);
      if (isCachableDbKey(field)) {
        Object.defineProperty(cachedMember.db, field, { value });
      }
    }
  },

  increment: async <K extends keyof PropertiesOfType<GuildMemberSchema, number>>(
    guild: Guild,
    userId: string,
    field: K,
    value: number,
  ) => {
    const { dbHost } = await guildModel.cache.get(guild);

    await shardDb.query(
      dbHost,
      `INSERT INTO guildMember (guildId,userId,${field}) VALUES (${guild.id},${mysql.escape(
        userId,
      )},${mysql.escape(value)}) ON DUPLICATE KEY UPDATE ${field} = ${field} + ${mysql.escape(
        value,
      )}`,
    );

    const member = guild.members.cache.get(userId);
    if (member && isCachableDbKey(field)) {
      const cachedMember = await cache.get(member);
      cachedMember.db[field] += value;
    }
  },
};

export async function getRankedUserIds(guild: Guild) {
  const { dbHost } = await guildModel.cache.get(guild);

  const textmessageUserIds = await shardDb.query<{ userId: string }[]>(
    dbHost,
    `SELECT DISTINCT userId FROM textMessage WHERE guildId = ${guild.id} AND alltime != 0`,
  );
  const voiceMinuteUserIds = await shardDb.query<{ userId: string }[]>(
    dbHost,
    `SELECT DISTINCT userId FROM voiceMinute WHERE guildId = ${guild.id} AND alltime != 0`,
  );
  const voteUserIds = await shardDb.query<{ userId: string }[]>(
    dbHost,
    `SELECT DISTINCT userId FROM vote WHERE guildId = ${guild.id} AND alltime != 0`,
  );
  const bonusUserIds = await shardDb.query<{ userId: string }[]>(
    dbHost,
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

async function buildCache(member: GuildMember): Promise<CachedGuildMember> {
  const { dbHost } = await guildModel.cache.get(member.guild);
  let foundCache = await shardDb.query<CachedDbFields[]>(
    dbHost,
    `SELECT ${cachedFields.join(',')} FROM guildMember WHERE guildId = ${
      member.guild.id
    } AND userId = ${member.id}`,
  );

  const db = foundCache.length > 0 ? foundCache[0] : { ...(await loadDefaultCache(dbHost)) };

  const res = { db, cache: {} };
  memberCache.set(member, res);

  return res;
}

const loadDefaultCache = async (dbHost: string) => {
  if (defaultCache) return defaultCache;

  let res = await shardDb.query<CachedDbFields[]>(
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
  return defaultCache;
};

export default {
  cache,
  storage,
  getRankedUserIds,
};
