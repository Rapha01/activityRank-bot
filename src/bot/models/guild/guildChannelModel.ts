import type { Guild, GuildBasedChannel } from 'discord.js';
import { getShardDb } from '../../../models/shardDb/shardDb.js';
import type {
  GuildChannelSchema,
  GuildChannel as DBChannel,
  GuildChannelUpdate,
} from 'models/types/kysely/shard.js';
import { getGuildModel } from './guildModel.js';
import { CachedModel } from '../generic/model.js';

const cachedFields = ['noXp', 'noCommand'] as const satisfies (keyof DBChannel)[];
let defaultCache: Pick<DBChannel, (typeof cachedFields)[number]> | null = null;
let defaultAll: DBChannel | null = null;

interface ChannelCacheStorage {}

export const channelCache = new WeakMap<GuildBasedChannel, ChannelModel>();

export class ChannelModel extends CachedModel<
  GuildBasedChannel,
  GuildChannelSchema,
  typeof cachedFields,
  ChannelCacheStorage
> {
  async fetchOptional() {
    const channel = await this.handle
      .selectFrom('guildChannel')
      .selectAll()
      .where('guildId', '=', this.object.guildId)
      .where('channelId', '=', this.object.id)
      .executeTakeFirst();

    return channel;
  }

  async fetch(error = false) {
    const user = await this.fetchOptional();
    if (user) return user;

    if (error) throw new Error(`Could not find channel ${this.object.id} in database`);
    return await this.fetchDefault();
  }

  async fetchDefault() {
    if (defaultAll) return defaultAll;

    const db = getShardDb(this.dbHost);

    let res = await db
      .selectFrom('guildChannel')
      .selectAll()
      .where('guildId', '=', this.object.guildId)
      .where('channelId', '=', this.object.id)
      .executeTakeFirst();

    if (!res) {
      res = await db
        .insertInto('guildChannel')
        .values({ channelId: '0', guildId: '0' })
        .returningAll()
        .executeTakeFirstOrThrow();
    }

    defaultAll = res;
    return defaultAll;
  }

  async upsert(expr: GuildChannelUpdate) {
    await this.handle
      .insertInto('guildChannel')
      .values({ channelId: this.object.id, guildId: this.object.guildId, ...expr })
      .onDuplicateKeyUpdate(expr)
      // .returning(cachedFields) RETURNING is not supported on UPDATE statements in MySQL.
      .executeTakeFirstOrThrow();

    const res = await this.handle
      .selectFrom('guildChannel')
      .select(cachedFields)
      .where('guildId', '=', this.object.guildId)
      .where('channelId', '=', this.object.id)
      .executeTakeFirstOrThrow();

    this._db = res;
  }
}

export async function getChannelModel(channel: GuildBasedChannel): Promise<ChannelModel> {
  if (channelCache.has(channel)) return channelCache.get(channel)!;
  else return await buildCache(channel);
}

async function buildCache(channel: GuildBasedChannel): Promise<ChannelModel> {
  const { dbHost } = await getGuildModel(channel.guild);
  const db = getShardDb(dbHost);

  const foundCache = await db
    .selectFrom('guildChannel')
    .select(cachedFields)
    .where('guildId', '=', channel.guildId)
    .where('channelId', '=', channel.id)
    .executeTakeFirst();

  const cache = foundCache ?? { ...(await loadDefaultCache(dbHost)) };

  const built = new ChannelModel(channel, dbHost, cache, {});

  channelCache.set(channel, built);
  return built;
}

export async function getRankedChannelIds(guild: Guild) {
  const { dbHost } = await getGuildModel(guild);
  const db = getShardDb(dbHost);

  const res = await db
    .selectFrom('textMessage')
    .distinct()
    .select('channelId')
    .where('guildId', '=', guild.id)
    .where('alltime', '!=', 0)
    .union(
      db
        .selectFrom('voiceMinute')
        .distinct()
        .select('channelId')
        .where('guildId', '=', guild.id)
        .where('alltime', '!=', 0),
    )
    .execute();

  return res.map(({ channelId }) => channelId);
}

export const getNoXpChannelIds = async (guild: Guild) => {
  const { dbHost } = await getGuildModel(guild);
  const db = getShardDb(dbHost);

  const res = await db
    .selectFrom('guildChannel')
    .select('channelId')
    .where('guildId', '=', guild.id)
    .where('noXp', '=', 1)
    .execute();

  return res.map(({ channelId }) => channelId);
};

export const getNoCommandChannelIds = async (guild: Guild) => {
  const { dbHost } = await getGuildModel(guild);
  const db = getShardDb(dbHost);

  const res = await db
    .selectFrom('guildChannel')
    .select('channelId')
    .where('guildId', '=', guild.id)
    .where('noCommand', '=', 1)
    .execute();

  return res.map(({ channelId }) => channelId);
};

async function loadDefaultCache(host: string) {
  if (defaultCache) return defaultCache; // mutability issue?
  const db = getShardDb(host);

  let res = await db
    .selectFrom('guildChannel')
    .select(cachedFields)
    .where('guildId', '=', '0')
    .where('channelId', '=', '0')
    .executeTakeFirst();

  if (!res) {
    res = await db
      .insertInto('guildChannel')
      .values({ channelId: '0', guildId: '0' })
      .returning(cachedFields)
      .executeTakeFirstOrThrow();
  }

  defaultCache = res;
  return defaultCache;
}
