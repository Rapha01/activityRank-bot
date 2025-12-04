import type { ShardDB } from '@activityrank/database';
import type { User } from 'discord.js';
import { manager } from '#models/managerDb/managerDb.ts';
import { shards } from '#models/shardDb/shardDb.ts';
import { CachedModel } from './generic/model.ts';

let defaultCache: Pick<ShardDB.User, (typeof cachedFields)[number]> | null = null;
let defaultAll: ShardDB.User | null = null;

const cachedFields = ['userId', 'isBanned'] as const satisfies (keyof ShardDB.User)[];

interface UserCacheStorage {
  patreonTier?: number;
  patreonTierUntilDate?: number;
  lastTopggUpvoteDate?: number;
}

export const userCache = new WeakMap<User, UserModel>();

export class UserModel extends CachedModel<
  User,
  ShardDB.Schema.User,
  typeof cachedFields,
  UserCacheStorage
> {
  async fetchOptional() {
    const user = await this.handle
      .selectFrom('user')
      .selectAll()
      .where('userId', '=', this._object.id)
      .executeTakeFirst();

    return user;
  }

  async fetch(error = false) {
    const user = await this.fetchOptional();
    if (user) return user;

    if (error) throw new Error(`Could not find user ${this._object.id} in database`);
    return await this.fetchDefault();
  }

  async fetchDefault() {
    if (defaultAll) return defaultAll;

    const { db } = shards.get(this.dbHost);

    let res = await db.selectFrom('user').selectAll().where('userId', '=', '0').executeTakeFirst();

    if (!res) {
      res = await db
        .insertInto('user')
        .values({ userId: '0' })
        .returningAll()
        .executeTakeFirstOrThrow();
    }

    defaultAll = res;
    return defaultAll;
  }

  async upsert(expr: ShardDB.UserUpdate) {
    await this.handle
      .insertInto('user')
      .values({ userId: this._object.id, ...expr })
      .onDuplicateKeyUpdate(expr)
      // .returning(cachedFields) RETURNING is not supported on UPDATE statements in MySQL.
      .executeTakeFirstOrThrow();

    const res = await this.handle
      .selectFrom('user')
      .select(cachedFields)
      .where('userId', '=', this._object.id)
      .executeTakeFirstOrThrow();

    this._db = res;
  }
}

export async function getUserModel(user: User): Promise<UserModel> {
  if (userCache.has(user)) return userCache.get(user) as UserModel;
  return await buildCache(user);
}

async function buildCache(user: User): Promise<UserModel> {
  const host = await getDbHost(user.id);

  const foundCache = await shards
    .get(host)
    .db.selectFrom('user')
    .select(cachedFields)
    .where('userId', '=', user.id)
    .executeTakeFirst();

  const cache = foundCache ?? { ...(await loadDefaultCache(host)) };

  const built = new UserModel(user, host, cache, {});

  userCache.set(user, built);
  return built;
}

async function getDbHost(userId: string): Promise<string> {
  const getRoute = manager.db
    .selectFrom('userRoute')
    .leftJoin('dbShard', 'userRoute.dbShardId', 'dbShard.id')
    .select('host')
    .where('userId', '=', userId);

  let res = await getRoute.executeTakeFirst();

  if (!res) {
    await manager.db.insertInto('userRoute').values({ userId }).executeTakeFirstOrThrow();
    res = await getRoute.executeTakeFirstOrThrow();
  }
  if (!res.host) {
    throw new Error(`Failed to map user ID "${userId}" to a database host.`);
  }

  return res.host;
}

async function loadDefaultCache(host: string) {
  if (defaultCache) return defaultCache;
  const { db } = shards.get(host);

  let res = await db
    .selectFrom('user')
    .select(cachedFields)
    .where('userId', '=', '0')
    .executeTakeFirst();

  if (!res) {
    await db
      .insertInto('user')
      .values({ userId: '0' })
      // .returning(cachedFields) RETURNING is not supported well in MySQL
      .executeTakeFirstOrThrow();
    res = await db
      .selectFrom('user')
      .select(cachedFields)
      .where('userId', '=', '0')
      .executeTakeFirstOrThrow();
  }

  defaultCache = res;
  return defaultCache;
}
