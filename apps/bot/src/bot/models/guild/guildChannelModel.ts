import type { ShardDB } from '@activityrank/database';
import type { Guild, GuildBasedChannel } from 'discord.js';
import { shards } from '#models/shardDb/shardDb.js';
import { getGuildModel } from './guildModel.js';

const cachedFields = ['noXp', 'noCommand'] as const;
let defaultCache: CachedDbFields | null = null;
let defaultAll: ShardDB.GuildChannel | null = null;

type CachedDbFields = Pick<ShardDB.GuildChannel, (typeof cachedFields)[number]>;

export interface CachedGuildChannel {
  db: CachedDbFields;
}

export const channelCache = new WeakMap<GuildBasedChannel, CachedGuildChannel>();

export const cache = {
  get: async (channel: GuildBasedChannel): Promise<CachedGuildChannel> => {
    if (channelCache.has(channel)) return channelCache.get(channel) as CachedGuildChannel;
    return await buildCache(channel);
  },
};

function isCachableDbKey(key: keyof ShardDB.GuildChannel): key is keyof CachedDbFields {
  return cachedFields.includes(key as keyof CachedDbFields);
}

export const storage = {
  get: async (guild: Guild, channelId: string): Promise<ShardDB.GuildChannel> => {
    const { dbHost } = await getGuildModel(guild);
    const { db } = shards.get(dbHost);

    const res = await db
      .selectFrom('guildChannel')
      .selectAll()
      .where('guildId', '=', guild.id)
      .where('channelId', '=', channelId)
      .executeTakeFirst();

    if (res) {
      return res;
    }

    if (!defaultAll) {
      defaultAll = await db
        .selectFrom('guildChannel')
        .selectAll()
        .where('guildId', '=', '0')
        .where('channelId', '=', '0')
        .executeTakeFirstOrThrow();
    }
    return defaultAll;
  },

  set: async <K extends keyof ShardDB.GuildChannel>(
    guild: Guild,
    channelId: string,
    field: K,
    value: ShardDB.GuildChannel[K],
  ) => {
    const { dbHost } = await getGuildModel(guild);
    const { db } = shards.get(dbHost);
    await db
      .insertInto('guildChannel')
      .values({
        guildId: guild.id,
        channelId,
        [field]: value,
      })
      .onDuplicateKeyUpdate({ [field]: value })
      .executeTakeFirstOrThrow();

    const channel = guild.channels.cache.get(channelId);
    if (channel && isCachableDbKey(field)) {
      const cachedChannel = await cache.get(channel);
      Object.defineProperty(cachedChannel.db, field, { value });
    }
  },
};

export const getRankedChannelIds = async (guild: Guild) => {
  const { dbHost } = await getGuildModel(guild);
  const { db } = shards.get(dbHost);

  const textMessageUserIds = await db
    .selectFrom('textMessage')
    .distinct()
    .select('channelId')
    .where('guildId', '=', guild.id)
    .where('alltime', '!=', 0)
    .execute();

  const voiceMinuteUserIds = await db
    .selectFrom('voiceMinute')
    .distinct()
    .select('channelId')
    .where('guildId', '=', guild.id)
    .where('alltime', '!=', 0)
    .execute();

  const ids = new Set([...textMessageUserIds, ...voiceMinuteUserIds]);

  const channelIds = [];
  for (const id of ids) {
    channelIds.push(id.channelId);
  }

  return channelIds;
};

export const getNoXpChannelIds = async (guild: Guild) => {
  const { dbHost } = await getGuildModel(guild);
  const res = await shards
    .get(dbHost)
    .db.selectFrom('guildChannel')
    .select('channelId')
    .where('guildId', '=', guild.id)
    .where('noXp', '=', 1)
    .execute();

  return res.map((i) => i.channelId);
};

export const getNoCommandChannelIds = async (guild: Guild) => {
  const { dbHost } = await getGuildModel(guild);
  const res = await shards
    .get(dbHost)
    .db.selectFrom('guildChannel')
    .select('channelId')
    .where('guildId', '=', guild.id)
    .where('noCommand', '=', 1)
    .execute();

  return res.map((i) => i.channelId);
};

async function buildCache(channel: GuildBasedChannel): Promise<CachedGuildChannel> {
  const { dbHost } = await getGuildModel(channel.guild);

  const foundCache = await shards
    .get(dbHost)
    .db.selectFrom('guildChannel')
    .select(cachedFields)
    .where('guildId', '=', channel.guild.id)
    .where('channelId', '=', channel.id)
    .executeTakeFirst();

  const db = foundCache ?? { ...(await loadDefaultCache(dbHost)) };

  const res = { db };
  channelCache.set(channel, res);
  return res;
}

const loadDefaultCache = async (dbHost: string) => {
  if (defaultCache) return defaultCache;
  const { db } = shards.get(dbHost);

  let res = await db
    .selectFrom('guildChannel')
    .select(cachedFields)
    .where('guildId', '=', '0')
    .where('channelId', '=', '0')
    .executeTakeFirst();

  if (!res) {
    await db
      .insertInto('guildChannel')
      .values({ channelId: '0', guildId: '0' })
      // .returning(cachedFields) RETURNING is not supported well in MySQL
      .executeTakeFirstOrThrow();
    res = await db
      .selectFrom('guildChannel')
      .select(cachedFields)
      .where('channelId', '=', '0')
      .where('guildId', '=', '0`')
      .executeTakeFirstOrThrow();
  }

  defaultCache = res;
  return defaultCache;
};

export default {
  cache,
  storage,
  getRankedChannelIds,
  getNoXpChannelIds,
  getNoCommandChannelIds,
};
