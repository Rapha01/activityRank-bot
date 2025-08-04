import type { ShardDB } from '@activityrank/database';
import type { Guild, GuildMember } from 'discord.js';
import { shards } from '../../../models/shardDb/shardDb.js';
import { CachedModel } from '../generic/model.js';
import { fetchMemberTotalXp } from '../rankModel.js';
import { getGuildModel } from './guildModel.js';

const cachedFields = [
  'notifyLevelupDm',
  'reactionVote',
] as const satisfies (keyof ShardDB.GuildMember)[];
let defaultCache: Pick<ShardDB.GuildMember, (typeof cachedFields)[number]> | null = null;
let defaultAll: ShardDB.GuildMember | null = null;

interface MemberCacheStorage {
  totalXp?: number;
  lastVoteDate?: Date | null;
  lastTextMessageDate?: Date | null;
  lastStatCommandDate?: Date | null;
  lastMessageChannelId?: string | null;
}

export const memberCache = new WeakMap<GuildMember, GuildMemberModel>();

export class GuildMemberModel extends CachedModel<
  GuildMember,
  ShardDB.Schema.GuildMember,
  typeof cachedFields,
  MemberCacheStorage
> {
  async fetchOptional() {
    const member = await this.handle
      .selectFrom('guildMember')
      .selectAll()
      .where('userId', '=', this._object.id)
      .where('guildId', '=', this._object.guild.id)
      .executeTakeFirst();

    return member;
  }

  async fetch(error = false) {
    const member = await this.fetchOptional();
    if (member) return member;

    if (error) throw new Error(`Could not find member ${this._object.id} in database`);
    return await this.fetchDefault();
  }

  async fetchDefault() {
    if (defaultAll) return defaultAll;

    const { db } = shards.get(this.dbHost);

    let res = await db
      .selectFrom('guildMember')
      .selectAll()
      .where('userId', '=', '0')
      .where('guildId', '=', '0')
      .executeTakeFirst();

    if (!res) {
      res = await db
        .insertInto('guildMember')
        .values({ userId: '0', guildId: '0' })
        .returningAll()
        .executeTakeFirstOrThrow();
    }

    defaultAll = res;
    return defaultAll;
  }

  async upsert(expr: ShardDB.GuildMemberUpdate) {
    await this.handle
      .insertInto('guildMember')
      .values({ userId: this._object.id, guildId: this._object.guild.id, ...expr })
      .onDuplicateKeyUpdate(expr)
      // .returning(cachedFields) RETURNING is not supported on UPDATE statements in MySQL.
      .executeTakeFirstOrThrow();

    const res = await this.handle
      .selectFrom('guildMember')
      .select(cachedFields)
      .where('guildId', '=', this._object.guild.id)
      .where('userId', '=', this._object.id)
      .executeTakeFirstOrThrow();

    this._db = res;
  }
}

export async function getRankedUserIds(guild: Guild) {
  const { dbHost } = await getGuildModel(guild);

  const rankedMembers = await shards
    .get(dbHost)
    .db.selectFrom('guildMember')
    .select('userId')
    .where('guildId', '=', guild.id)
    .where('alltime', '!=', 0)
    .execute();

  return rankedMembers.map(({ userId }) => userId);
}

export async function getMemberModel(member: GuildMember): Promise<GuildMemberModel> {
  if (memberCache.has(member)) return memberCache.get(member) as GuildMemberModel;
  return await buildCache(member);
}

async function buildCache(member: GuildMember): Promise<GuildMemberModel> {
  const { dbHost } = await getGuildModel(member.guild);
  const { db } = shards.get(dbHost);

  const foundCache = await db
    .selectFrom('guildMember')
    .select(cachedFields)
    .where('guildId', '=', member.guild.id)
    .where('userId', '=', member.id)
    .executeTakeFirst();

  const cache = foundCache ?? { ...(await loadDefaultCache(dbHost)) };

  const built = new GuildMemberModel(member, dbHost, cache, {
    totalXp: await fetchMemberTotalXp(member.guild, member.id),
  });

  memberCache.set(member, built);
  return built;
}

const loadDefaultCache = async (dbHost: string) => {
  if (defaultCache) return defaultCache;
  const { db } = shards.get(dbHost);

  let res = await db
    .selectFrom('guildMember')
    .select(cachedFields)
    .where('userId', '=', '0')
    .where('guildId', '=', '0')
    .executeTakeFirst();

  if (!res) {
    await db
      .insertInto('guildMember')
      .values({ userId: '0', guildId: '0' })
      // .returning(cachedFields) RETURNING is not supported well in MySQL
      .executeTakeFirstOrThrow();
    res = await db
      .selectFrom('guildMember')
      .select(cachedFields)
      .where('userId', '=', '0')
      .where('guildId', '=', '0`')
      .executeTakeFirstOrThrow();
  }

  defaultCache = res;
  return defaultCache;
};
