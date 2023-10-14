import type { Guild, GuildBasedChannel } from 'discord.js';
import shardDb from '../../../models/shardDb/shardDb.js';
import mysql from 'promise-mysql';
import type { guildChannel, textMessage, voiceMinute } from 'models/types/shard.js';

const promises = new Map<string, Promise<void>>();

const cachedFields = ['noXp', 'noCommand'] as const;
let defaultCache: CachedGuildChannel | null = null;
let defaultAll: guildChannel | null = null;

export type CachedGuildChannel = Pick<guildChannel, (typeof cachedFields)[number]>;

export const cache = {
  load: (channel: GuildBasedChannel) => {
    if (!channel.appData) {
      if (promises.has(channel.id)) {
        return promises.get(channel.id)!;
      }

      promises.set(
        channel.id,
        buildCache(channel).finally(() => promises.delete(channel.id)),
      );

      return promises.delete(channel.id);
    }

    return new Promise<void>(async (resolve) => resolve());
  },
};

export const storage = {
  get: async (guild: Guild, channelId: string): Promise<guildChannel> => {
    const res = await shardDb.query<guildChannel[]>(
      guild.appData.dbHost,
      `SELECT * FROM guildChannel WHERE guildId = ${guild.id} && channelId = ${mysql.escape(
        channelId,
      )}`,
    );

    if (res.length == 0) {
      if (!defaultAll)
        defaultAll = (
          await shardDb.query<guildChannel[]>(
            guild.appData.dbHost,
            `SELECT * FROM guildChannel WHERE guildId = 0 AND channelId = 0`,
          )
        )[0];
      return defaultAll;
    } else return res[0];
  },

  set: async <K extends keyof guildChannel>(
    guild: Guild,
    channelId: string,
    field: K,
    value: guildChannel[K],
  ) => {
    await shardDb.query(
      guild.appData.dbHost,
      `INSERT INTO guildChannel (guildId,channelId,${field}) VALUES (${guild.id},${mysql.escape(
        channelId,
      )},${mysql.escape(value)}) ON DUPLICATE KEY UPDATE ${field} = ${mysql.escape(value)}`,
    );

    const channel = guild.channels.cache.get(channelId);
    if (channel && channel.appData && (cachedFields as readonly string[]).includes(field))
      channel.appData[field] = value;
  },
};

export const getRankedChannelIds = async (guild: Guild) => {
  const textmessageUserIds = await shardDb.query<textMessage[]>(
    guild.appData.dbHost,
    `SELECT DISTINCT channelId FROM textMessage WHERE guildId = ${guild.id} AND alltime != 0`,
  );
  const voiceMinuteUserIds = await shardDb.query<voiceMinute[]>(
    guild.appData.dbHost,
    `SELECT DISTINCT channelId FROM voiceMinute WHERE guildId = ${guild.id} AND alltime != 0`,
  );

  const ids = [...new Set([...textmessageUserIds, ...voiceMinuteUserIds])];

  let channelIds = [];
  for (let id of ids) {
    channelIds.push(id.channelId);
  }

  return channelIds;
};

export const getNoXpChannelIds = async (guild: Guild) => {
  const res = await shardDb.query<guildChannel[]>(
    guild.appData.dbHost,
    `SELECT channelId FROM guildChannel WHERE guildId = ${guild.id} AND noXp = 1`,
  );

  return res.map((i) => i.channelId);
};

export const getNoCommandChannelIds = async (guild: Guild) => {
  const res = await shardDb.query<guildChannel[]>(
    guild.appData.dbHost,
    `SELECT channelId FROM guildChannel WHERE guildId = ${guild.id} AND noCommand = 1`,
  );

  return res.map((i) => i.channelId);
};

const buildCache = async (channel: GuildBasedChannel) => {
  let foundCache = await shardDb.query<CachedGuildChannel[]>(
    channel.guild.appData.dbHost,
    `SELECT ${cachedFields.join(',')} FROM guildChannel WHERE guildId = ${
      channel.guild.id
    } AND channelId = ${channel.id}`,
  );

  let cache;

  if (foundCache.length > 0) cache = foundCache[0];
  else {
    if (!defaultCache) await loadDefaultCache(channel.guild.appData.dbHost);
    cache = Object.assign({}, defaultCache);
  }

  channel.appData = cache;
};

const loadDefaultCache = async (dbHost: string) => {
  let res = await shardDb.query<guildChannel[]>(
    dbHost,
    `SELECT ${cachedFields.join(',')} FROM guildChannel WHERE guildId = 0 AND channelId = 0`,
  );

  if (res.length == 0)
    await shardDb.query(dbHost, `INSERT IGNORE INTO guildChannel (guildId,channelId) VALUES (0,0)`);

  res = await shardDb.query(
    dbHost,
    `SELECT ${cachedFields.join(',')} FROM guildChannel WHERE guildId = 0 AND channelId = 0`,
  );

  defaultCache = res[0];
};

export default {
  cache,
  storage,
  getRankedChannelIds,
  getNoXpChannelIds,
  getNoCommandChannelIds,
};
