import shardDb, { getShardDb } from '../../../models/shardDb/shardDb.js';
import type { Guild, GuildMember } from 'discord.js';
import type {
  GuildMember as DBMember,
  GuildMemberSchema,
  GuildMemberUpdate,
} from 'models/types/kysely/shard.js';
import { getGuildModel } from './guildModel.js';
import { getGuildMemberTotalScore } from '../rankModel.js';
import { CachedModel } from '../generic/model.js';

const cachedFields = ['notifyLevelupDm', 'reactionVote'] as const;
let defaultCache: Pick<DBMember, (typeof cachedFields)[number]> | null = null;

interface MemberCacheStorage {
  totalXp?: number;
  totalScore?: number;
  lastVoteDate?: Date | null;
  lastTextMessageDate?: Date | null;
  lastStatCommandDate?: Date | null;
  lastMessageChannelId?: string | null;
}

export const memberCache = new WeakMap<GuildMember, GuildMemberModel>();

export class GuildMemberModel extends CachedModel<
  GuildMember,
  GuildMemberSchema,
  typeof cachedFields,
  MemberCacheStorage
> {
  async fetch() {
    const member = await this.handle
      .selectFrom('guildMember')
      .selectAll()
      .where('guildId', '=', this.object.guild.id)
      .where('userId', '=', this.object.id)
      .executeTakeFirst();

    if (!member)
      throw new Error(
        `Could not find member ${this.object.id} [${this.object.guild.id}] in database`,
      );
    return member;
  }

  async upsert(expr: GuildMemberUpdate) {
    await this.handle
      .insertInto('guildMember')
      .values({ userId: this.object.id, guildId: this.object.guild.id, ...expr })
      .onDuplicateKeyUpdate(expr)
      // .returning(cachedFields) RETURNING is not supported on UPDATE statements in MySQL.
      .executeTakeFirstOrThrow();

    const res = await this.handle
      .selectFrom('guildMember')
      .select(cachedFields)
      .where('guildId', '=', this.object.guild.id)
      .where('userId', '=', this.object.id)
      .executeTakeFirstOrThrow();

    this._db = res;
  }
}

export async function getRankedUserIds(guild: Guild) {
  const { dbHost } = await getGuildModel(guild);

  const db = getShardDb(dbHost);

  const xpTypes = ['voiceMinute', 'invite', 'vote', 'bonus'] as const;

  let idQuery = db
    .selectFrom('textMessage')
    .distinct()
    .select('userId')
    .where('guildId', '=', guild.id)
    .where('alltime', '!=', 0);

  for (const type of xpTypes) {
    idQuery = idQuery.union(
      db
        .selectFrom(type)
        .distinct()
        .select('userId')
        .where('guildId', '=', guild.id)
        .where('alltime', '!=', 0),
    );
  }

  const res = await idQuery.execute();

  return res.map(({ userId }) => userId);
}

export async function getMemberModel(member: GuildMember): Promise<GuildMemberModel> {
  if (memberCache.has(member)) return memberCache.get(member)!;
  else return await buildCache(member);
}

async function buildCache(member: GuildMember): Promise<GuildMemberModel> {
  const { dbHost } = await getGuildModel(member.guild);
  const db = getShardDb(dbHost);

  const foundCache = await db
    .selectFrom('guildMember')
    .select(cachedFields)
    .where('guildId', '=', member.guild.id)
    .where('userId', '=', member.id)
    .executeTakeFirst();

  const cache = foundCache ?? { ...(await loadDefaultCache(dbHost)) };

  const built = new GuildMemberModel(member, dbHost, cache, {
    totalXp: parseInt(await getGuildMemberTotalScore(member.guild, member.id)),
  });

  memberCache.set(member, built);
  return built;
}

const loadDefaultCache = async (dbHost: string) => {
  if (defaultCache) return defaultCache;
  const db = getShardDb(dbHost);

  let res = await db
    .selectFrom('guildMember')
    .select(cachedFields)
    .where('userId', '=', '0')
    .where('guildId', '=', '0')
    .executeTakeFirst();

  if (!res) {
    res = await db
      .insertInto('guildMember')
      .values({ userId: '0', guildId: '0' })
      .returning(cachedFields)
      .executeTakeFirstOrThrow();
  }

  defaultCache = res;
  return defaultCache;
};
