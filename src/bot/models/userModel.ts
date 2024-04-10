import { getShardDb } from 'models/shardDb/shardDb.js';
import { getManagerDb } from 'models/managerDb/managerDb.js';
import type { User } from 'discord.js';
import type { User as DBUser, UserSchema, UserUpdate } from 'models/types/kysely/shard.js';
import { CachedModel } from './generic/model.js';

let defaultCache: Pick<DBUser, (typeof cachedFields)[number]> | null = null;

const cachedFields = ['userId', 'isBanned'] as const;
const hostField = process.env.NODE_ENV == 'production' ? 'hostIntern' : 'hostExtern';

interface UserCacheStorage {
  patreonTier?: number;
  patreonTierUntilDate?: number;
  lastTopggUpvoteDate?: number;
}

export const userCache = new WeakMap<User, UserModel>();

export class UserModel extends CachedModel<
  User,
  UserSchema,
  typeof cachedFields,
  UserCacheStorage
> {
  async fetch() {
    const member = await this.handle
      .selectFrom('user')
      .selectAll()
      .where('userId', '=', this.object.id)
      .executeTakeFirst();

    if (!member) throw new Error(`Could not find user ${this.object.id} in database`);
    return member;
  }

  async upsert(expr: UserUpdate) {
    const result = await this.handle
      .insertInto('user')
      .values({ userId: this.object.id, ...expr })
      .onDuplicateKeyUpdate(expr)
      .returning(cachedFields)
      .executeTakeFirstOrThrow();

    this._db = result;
  }
}

export async function getUserModel(user: User): Promise<UserModel> {
  if (userCache.has(user)) return userCache.get(user)!;
  else return await buildCache(user);
}

async function buildCache(user: User): Promise<UserModel> {
  const host = await getDbHost(user.id);
  const db = getShardDb(host);

  const foundCache = await db
    .selectFrom('user')
    .select(cachedFields)
    .where('userId', '=', user.id)
    .executeTakeFirst();
  const cache = foundCache ?? { ...(await loadDefaultCache(host)) };

  const built = new UserModel(user, host, cache, {});

  userCache.set(user, built);
  return built;
}

async function getDbHost(userId: string): Promise<string> {
  const db = getManagerDb();

  const getRoute = db
    .selectFrom('userRoute')
    .leftJoin('dbShard', 'userRoute.dbShardId', 'dbShard.id')
    .select(`${hostField} as host`)
    .where('userId', '=', userId);

  let res = await getRoute.executeTakeFirst();

  if (!res) {
    await db.insertInto('userRoute').values({ userId }).executeTakeFirstOrThrow();
    res = await getRoute.executeTakeFirstOrThrow();
  }
  if (!res.host) {
    throw new Error(`Failed to map user ID "${userId}" to a database host.`);
  }

  return res.host;
}

async function loadDefaultCache(host: string) {
  if (defaultCache) return defaultCache;
  const db = getShardDb(host);

  let res = await db
    .selectFrom('user')
    .select(cachedFields)
    .where('userId', '=', '0')
    .executeTakeFirst();

  if (!res) {
    res = await db
      .insertInto('user')
      .values({ userId: '0' })
      .returning(cachedFields)
      .executeTakeFirstOrThrow();
  }

  defaultCache = res;
  return defaultCache;
}
