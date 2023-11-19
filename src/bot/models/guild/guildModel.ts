import shardDb from '../../../models/shardDb/shardDb.js';
import managerDb from '../../../models/managerDb/managerDb.js';
import mysql from 'promise-mysql';
import type { Guild } from 'discord.js';
import type { GuildSchema } from 'models/types/shard.js';
import type { PropertiesOfType } from 'models/types/generics.js';

const hostField = process.env.NODE_ENV == 'production' ? 'hostIntern' : 'hostExtern';
const cachedFields = [
  //'tokens',
  'showNicknames',
  'textXp',
  'voiceXp',
  'inviteXp',
  'voteXp',
  'bonusXp',
  'textMessageCooldownSeconds',
  'voteCooldownSeconds',
  'xpPerTextMessage',
  'xpPerVoiceMinute',
  'voteTag',
  'voteEmote',
  'bonusTag',
  'bonusEmote',
  'entriesPerPage',
  'xpPerVote',
  'xpPerInvite',
  'xpPerBonus',
  'bonusPerTextMessage',
  'bonusPerVoiceMinute',
  'bonusPerVote',
  'bonusPerInvite',
  'bonusUntilDate',
  'levelFactor',
  'reactionVote',
  'allowMutedXp',
  'allowSoloXp',
  'allowInvisibleXp',
  'allowDeafenedXp',
  'notifyLevelupDm',
  'notifyLevelupWithRole',
  'notifyLevelupCurrentChannel',
  'takeAwayAssignedRolesOnLevelDown',
  'roleAssignMessage',
  'roleDeassignMessage',
  'commandOnlyChannel',
  'autopost_serverJoin',
  'autopost_levelup',
  'levelupMessage',
  'serverJoinMessage',
  'addDate',
  'isBanned',
] as const;

type CachedDbFields = Pick<GuildSchema, (typeof cachedFields)[number]>;

// TODO convert to dates
interface GuildCacheStorage {
  lastAskForPremiumDate?: Date;
  lastResetServer?: Date;
}
export interface CachedGuild {
  db: CachedDbFields;
  dbHost: string;
  cache: GuildCacheStorage;
}
const guildCache = new WeakMap<Guild, CachedGuild>();

export const cache = {
  get: async function (guild: Guild): Promise<CachedGuild> {
    if (guildCache.has(guild)) return guildCache.get(guild)!;
    else return await buildCache(guild);
  },
};

function isCachableDbKey(key: keyof GuildSchema): key is keyof CachedDbFields {
  return cachedFields.includes(key as keyof CachedDbFields);
}

export const storage = {
  set: async <K extends Exclude<keyof GuildSchema, 'guildId'>>(
    guild: Guild,
    field: K,
    value: GuildSchema[K],
  ) => {
    const cachedGuild = await cache.get(guild);
    await shardDb.query(
      cachedGuild.dbHost,
      `UPDATE guild SET ${field} = ${mysql.escape(value)} WHERE guildId = ${guild.id}`,
    );

    if (isCachableDbKey(field)) {
      Object.defineProperty(cachedGuild.db, field, { value });
    }
  },
  increment: async <K extends keyof PropertiesOfType<GuildSchema, number>>(
    guild: Guild,
    field: K,
    value: GuildSchema[K],
  ) => {
    const cachedGuild = await cache.get(guild);
    await shardDb.query(
      cachedGuild.dbHost,
      `UPDATE guild SET ${field} = ${field} + ${mysql.escape(value)} WHERE guildId = ${guild.id}`,
    );

    if (isCachableDbKey(field)) {
      cachedGuild.db[field] += value;
    }
  },
  get: async (guild: Guild) => {
    const cachedGuild = await cache.get(guild);

    const res = await shardDb.query<GuildSchema[]>(
      cachedGuild.dbHost,
      `SELECT * FROM guild WHERE guildId = ${guild.id}`,
    );

    if (res.length == 0) return null;
    else return res[0];
  },
};

async function buildCache(guild: Guild): Promise<CachedGuild> {
  const dbHost = await getDbHost(guild.id);
  let cache = await shardDb.query<CachedDbFields[]>(
    dbHost,
    `SELECT ${cachedFields.join(',')} FROM guild WHERE guildId = ${guild.id}`,
  );

  if (cache.length == 0) {
    await shardDb.query(
      dbHost,
      `INSERT INTO guild (guildId,joinedAtDate,addDate) VALUES (${guild.id},${Math.floor(
        guild.members.me!.joinedAt!.getTime() / 1000,
      )},${Math.floor(Date.now() / 1000)})`,
    );
    cache = await shardDb.query<CachedDbFields[]>(
      dbHost,
      `SELECT ${cachedFields.join(',')} FROM guild WHERE guildId = ${guild.id}`,
    );
  }

  const cachedGuild = cache[0]!;
  return { cache: {}, db: cachedGuild, dbHost };
}

const getDbHost = async (guildId: string): Promise<string> => {
  let res = await managerDb.query<{ host: string }[]>(
    `SELECT ${hostField} AS host FROM guildRoute LEFT JOIN dbShard ON guildRoute.dbShardId = dbShard.id WHERE guildId = ${guildId}`,
  );

  if (res.length < 1) {
    await managerDb.query(`INSERT INTO guildRoute (guildId) VALUES (${guildId})`);
    res = await managerDb.query(
      `SELECT ${hostField} AS host FROM guildRoute LEFT JOIN dbShard ON guildRoute.dbShardId = dbShard.id WHERE guildId = ${guildId}`,
    );
  }

  return res[0].host;
};

export default {
  cache,
  storage,
};
