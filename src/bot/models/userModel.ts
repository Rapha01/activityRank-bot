import shardDb from '../../models/shardDb/shardDb.js';
import managerDb from '../../models/managerDb/managerDb.js';
import mysql from 'promise-mysql';
import type { User } from 'discord.js';
import type { UserSchema } from 'models/types/shard.js';
import type { PropertiesOfType } from 'models/types/generics.js';

let defaultCache: CachedDbFields | null = null;
let defaultAll: UserSchema | null = null;
const cachedFields = ['userId', 'isBanned'] as const;
const hostField = process.env.NODE_ENV == 'production' ? 'hostIntern' : 'hostExtern';

type CachedDbFields = Pick<UserSchema, (typeof cachedFields)[number]>;

interface UserCacheStorage {
  patreonTier?: number;
  patreonTierUntilDate?: number;
  lastTopggUpvoteDate?: number;
}

interface CachedUser {
  db: CachedDbFields;
  dbHost: string;
  cache: UserCacheStorage;
}

const userCache = new WeakMap<User, CachedUser>();

export const cache = {
  get: async function (user: User): Promise<CachedUser> {
    if (userCache.has(user)) return userCache.get(user)!;
    return await buildCache(user);
  },
  /* load: async function (user: User) {
    if (user.appData) return;
    if (promises.has(user.id)) return promises.get(user.id)!;

    promises.set(
      user.id,
      buildCache(user).finally(() => promises.delete(user.id)),
    );

    return promises.get(user.id)!;
  }, */
};

function isCachableDbKey(key: keyof UserSchema): key is keyof CachedDbFields {
  return cachedFields.includes(key as keyof CachedDbFields);
}

const storage = {
  set: async function <K extends keyof UserSchema>(user: User, field: K, value: UserSchema[K]) {
    const cachedUser = await cache.get(user);
    await shardDb.query(
      cachedUser.dbHost,
      `INSERT INTO user 
      (userId,${field}) 
      VALUES 
      (${user.id},${mysql.escape(value)})
      ON DUPLICATE KEY UPDATE 
      ${field} = ${mysql.escape(value)}`,
    );

    if (isCachableDbKey(field)) {
      // Typescript can't handle `cachedUser.db[_field] = value`
      // when `value` is a mixed type, even with the type narrowing
      // because the relationship between `K` and `value` is lost
      Object.defineProperty(cachedUser.db, field, { value });
    }
  },
  increment: async function <K extends keyof PropertiesOfType<UserSchema, number>>(
    user: User,
    field: K,
    value: UserSchema[K],
  ) {
    const cachedUser = await cache.get(user);
    await shardDb.query(
      cachedUser.dbHost,
      `INSERT INTO user (userId,${field}) VALUES (${user.id},DEFAULT(${field}) + ${mysql.escape(
        value,
      )}) ON DUPLICATE KEY UPDATE ${field} = ${field} + ${mysql.escape(value)}`,
    );

    if (isCachableDbKey(field)) {
      cachedUser.db[field] += value;
    }
  },
  get: async function (user: User) {
    const cachedUser = await cache.get(user);

    const res = await shardDb.query<UserSchema[]>(
      cachedUser.dbHost,
      `SELECT * FROM user WHERE userId = ${user.id}`,
    );

    if (res.length == 0) {
      if (!defaultAll)
        defaultAll = (
          await shardDb.query<UserSchema[]>(
            cachedUser.dbHost,
            `SELECT * FROM user WHERE userId = 0`,
          )
        )[0];
      return defaultAll;
    } else return res[0];
  },
};

async function buildCache(user: User): Promise<CachedUser> {
  const dbHost = await getDbHost(user.id);
  let foundCache = await shardDb.query<CachedDbFields[]>(
    dbHost,
    `SELECT ${cachedFields.join(',')} FROM user WHERE userId = ${user.id}`,
  );

  const db = foundCache.length > 0 ? foundCache[0] : { ...(await loadDefaultCache(dbHost)) };

  return { dbHost, db, cache: {} };
}

async function getDbHost(userId: string): Promise<string> {
  let res = await managerDb.query<{ host: string }[]>(
    `SELECT ${hostField} AS host FROM userRoute LEFT JOIN dbShard ON userRoute.dbShardId = dbShard.id WHERE userId = ${userId}`,
  );

  if (res.length < 1) {
    await managerDb.query(`INSERT INTO userRoute (userId) VALUES (${userId})`);
    res = await managerDb.query(
      `SELECT ${hostField} AS host FROM userRoute LEFT JOIN dbShard ON userRoute.dbShardId = dbShard.id WHERE userId = ${userId}`,
    );
  }

  return res[0].host;
}

async function loadDefaultCache(dbHost: string) {
  if (defaultCache) return defaultCache;

  let res = await shardDb.query<CachedDbFields[]>(
    dbHost,
    `SELECT ${cachedFields.join(',')} FROM user WHERE userId = 0`,
  );

  if (res.length == 0) await shardDb.query(dbHost, `INSERT IGNORE INTO user (userId) VALUES (0)`);

  res = await shardDb.query(dbHost, `SELECT ${cachedFields.join(',')} FROM user WHERE userId = 0`);

  defaultCache = res[0];
  return defaultCache;
}

export default { cache, storage };
