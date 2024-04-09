import { getShardDb } from 'models/shardDb/shardDb.js';
import { getManagerDb } from 'models/managerDb/managerDb.js';
import type { GuildSchema, GuildUpdate } from 'models/types/kysely/shard.js';
import { CachedModel } from '../generic/model.js';
import type { Guild } from 'discord.js';

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

// TODO convert to dates
interface GuildCacheStorage {
  lastAskForPremiumDate?: Date;
  lastResetServer?: Date;
}
export const guildCache = new WeakMap<Guild, GuildModel>();

export class GuildModel extends CachedModel<
  Guild,
  GuildSchema,
  typeof cachedFields,
  GuildCacheStorage
> {
  async fetch() {
    const guild = await this.handle
      .selectFrom('guild')
      .selectAll()
      .where('guildId', '=', this.object.id)
      .executeTakeFirst();

    if (!guild) throw new Error(`Could not find guild ${this.object.id} in database`);
    return guild;
  }

  async upsert(expr: GuildUpdate) {
    const result = await this.handle
      .insertInto('guild')
      .values({ guildId: this.object.id, ...expr })
      .onDuplicateKeyUpdate(expr)
      .returning(cachedFields)
      .executeTakeFirstOrThrow();

    this._db = result;
  }
}

export async function getGuildModel(guild: Guild): Promise<GuildModel> {
  if (guildCache.has(guild)) return guildCache.get(guild)!;
  else return await buildCache(guild);
}

async function buildCache(guild: Guild): Promise<GuildModel> {
  const host = await getDbHost(guild.id);
  const db = getShardDb(host);

  const fetch = db.selectFrom('guild').select(cachedFields).where('guildId', '=', guild.id);

  let cache = await fetch.executeTakeFirst();

  if (!cache) {
    await db
      .insertInto('guild')
      .values({
        guildId: guild.id,
        joinedAtDate: Math.floor(guild.members.me!.joinedAt!.getTime() / 1000),
        addDate: Math.floor(Date.now() / 1000),
      })
      .executeTakeFirstOrThrow();

    cache = await fetch.executeTakeFirstOrThrow();
  }

  const built = new GuildModel(guild, host, cache, {});

  guildCache.set(guild, built);
  return built;
}

const getDbHost = async (guildId: string): Promise<string> => {
  const db = getManagerDb();

  const getRoute = db
    .selectFrom('guildRoute')
    .leftJoin('dbShard', 'guildRoute.dbShardId', 'dbShard.id')
    .select(`${hostField} as host`)
    .where('guildId', '=', guildId);

  let res = await getRoute.executeTakeFirst();

  if (!res) {
    await db.insertInto('guildRoute').values({ guildId }).executeTakeFirst();
    res = await getRoute.executeTakeFirstOrThrow();
  }
  if (!res.host) {
    throw new Error(`Failed to map guild ID "${guildId}" to a database host.`);
  }

  return res.host;
};
