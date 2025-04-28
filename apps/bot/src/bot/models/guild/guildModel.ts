import type { ShardDB } from '@activityrank/database';
import { shards } from '#models/shardDb/shardDb.js';
import { manager } from '#models/managerDb/managerDb.js';
import { CachedModel } from '../generic/model.js';
import type { Guild } from 'discord.js';

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
  'autopost_serverJoin',
  'autopost_levelup',
  'levelupMessage',
  'serverJoinMessage',
  'addDate',
  'isBanned',
  'resetDeletedMembers',
  'stickyLevelRoles',
] as const;

interface GuildCacheStorage {
  lastAskForPremiumDate?: Date;
  lastResetServer?: Date;
  debugMode: boolean;
}
export const guildCache = new WeakMap<Guild, GuildModel>();

export class GuildModel extends CachedModel<
  Guild,
  ShardDB.Schema.Guild,
  typeof cachedFields,
  GuildCacheStorage
> {
  async fetch() {
    const guild = await this.handle
      .selectFrom('guild')
      .selectAll()
      .where('guildId', '=', this._object.id)
      .executeTakeFirst();

    if (!guild) throw new Error(`Could not find guild ${this._object.id} in database`);
    return guild;
  }

  async upsert(expr: ShardDB.GuildUpdate) {
    await this.handle
      .insertInto('guild')
      .values({ guildId: this._object.id, ...expr })
      .onDuplicateKeyUpdate(expr)
      // .returning(cachedFields) RETURNING is not supported on UPDATE statements in MySQL.
      .executeTakeFirstOrThrow();

    const res = await this.handle
      .selectFrom('guild')
      .select(cachedFields)
      .where('guildId', '=', this._object.id)
      .executeTakeFirstOrThrow();

    this._db = res;
  }
}

export async function getGuildModel(guild: Guild): Promise<GuildModel> {
  if (guildCache.has(guild)) return guildCache.get(guild) as GuildModel;
  return await buildCache(guild);
}

async function buildCache(guild: Guild): Promise<GuildModel> {
  const host = await getDbHost(guild.id);
  const { db } = shards.get(host);

  const fetch = db.selectFrom('guild').select(cachedFields).where('guildId', '=', guild.id);

  let cache = await fetch.executeTakeFirst();

  if (!cache) {
    await db
      .insertInto('guild')
      .values({
        guildId: guild.id,
        joinedAtDate: Math.floor(guild.members.me?.joinedAt?.getTime() ?? 0 / 1000).toString(),
        addDate: Math.floor(Date.now() / 1000).toString(),
      })
      .executeTakeFirstOrThrow();

    cache = await fetch.executeTakeFirstOrThrow();
  }

  const built = new GuildModel(guild, host, cache, { debugMode: false });

  guildCache.set(guild, built);
  return built;
}

const getDbHost = async (guildId: string): Promise<string> => {
  const getRoute = manager.db
    .selectFrom('guildRoute')
    .leftJoin('dbShard', 'guildRoute.dbShardId', 'dbShard.id')
    .select('host')
    .where('guildId', '=', guildId);

  let res = await getRoute.executeTakeFirst();

  if (!res) {
    await manager.db.insertInto('guildRoute').values({ guildId }).executeTakeFirst();
    res = await getRoute.executeTakeFirstOrThrow();
  }
  if (!res.host) {
    throw new Error(`Failed to map guild ID "${guildId}" to a database host.`);
  }

  return res.host;
};
