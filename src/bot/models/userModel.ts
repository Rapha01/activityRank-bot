import shardDb from '../../models/shardDb/shardDb.js';
import managerDb from '../../models/managerDb/managerDb.js';
import mysql from 'promise-mysql';
import type { User } from 'discord.js';
import type { user } from 'models/types/shard.js';
import type { PropertiesOfType } from 'models/types/generics.js';

const promises = new Map<string, Promise<void>>();

let defaultCache: CachedUser | null = null;
let defaultAll: user | null = null;
const cachedFields = ['userId', 'isBanned'] as const;
const cachedFieldSet: Set<string> = new Set(cachedFields);
const hostField = process.env.NODE_ENV == 'production' ? 'hostIntern' : 'hostExtern';

export type CachedUser = Pick<user, (typeof cachedFields)[number]> & {
  dbHost: string;
};

export const cache = {
  load: async function (user: User) {
    if (user.appData) return;
    if (promises.has(user.id)) return promises.get(user.id)!;

    promises.set(
      user.id,
      buildCache(user).finally(() => promises.delete(user.id)),
    );

    return promises.get(user.id)!;
  },
};

const storage = {
  set: async function <K extends keyof CachedUser>(user: User, field: K, value: CachedUser[K]) {
    await shardDb.query(
      user.appData.dbHost,
      `INSERT INTO user 
      (userId,${field}) 
      VALUES 
      (${user.id},${mysql.escape(value)})
      ON DUPLICATE KEY UPDATE 
      ${field} = ${mysql.escape(value)}`,
    );

    if (cachedFieldSet.has(field)) user.appData[field] = value;
  },
  increment: async function <K extends keyof PropertiesOfType<CachedUser, number>>(
    user: User,
    field: K,
    value: CachedUser[K],
  ) {
    await shardDb.query(
      user.appData.dbHost,
      `INSERT INTO user (userId,${field}) VALUES (${user.id},DEFAULT(${field}) + ${mysql.escape(
        value,
      )}) ON DUPLICATE KEY UPDATE ${field} = ${field} + ${mysql.escape(value)}`,
    );

    if (cachedFieldSet.has(field)) user.appData[field]! += value;
  },
  get: async function (user: User) {
    const res = await shardDb.query<user[]>(
      user.appData.dbHost,
      `SELECT * FROM user WHERE userId = ${user.id}`,
    );

    if (res.length == 0) {
      if (!defaultAll)
        defaultAll = (
          await shardDb.query<user[]>(user.appData.dbHost, `SELECT * FROM user WHERE userId = 0`)
        )[0];
      return defaultAll;
    } else return res[0];
  },
};

async function buildCache(user: User) {
  const dbHost = await getDbHost(user.id);
  let foundCache = await shardDb.query<CachedUser[]>(
    dbHost,
    `SELECT ${cachedFields.join(',')} FROM user WHERE userId = ${user.id}`,
  );

  let cache;

  if (foundCache.length > 0) cache = foundCache[0];
  else {
    if (!defaultCache) await loadDefaultCache(dbHost);
    cache = Object.assign({}, defaultCache);
  }

  cache.dbHost = dbHost;
  user.appData = cache;
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
  let res = await shardDb.query<CachedUser[]>(
    dbHost,
    `SELECT ${cachedFields.join(',')} FROM user WHERE userId = 0`,
  );

  if (res.length == 0) await shardDb.query(dbHost, `INSERT IGNORE INTO user (userId) VALUES (0)`);

  res = await shardDb.query(dbHost, `SELECT ${cachedFields.join(',')} FROM user WHERE userId = 0`);

  defaultCache = res[0];
}

export default { cache, storage };
