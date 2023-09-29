import shardDb from '../../models/shardDb/shardDb.js';
import managerDb from '../../models/managerDb/managerDb.js';
import mysql from 'promise-mysql';
import type { User } from 'discord.js';
import type { user } from 'models/types/shard.js';

const promises: Record<string, Promise<void>> = {};
let defaultCache: any = null;
let defaultAll: any = null;
const cachedFields = ['userId', 'isBanned'];
const cachedFieldSet = new Set(cachedFields);
const hostField = process.env.NODE_ENV == 'production' ? 'hostIntern' : 'hostExtern';

export const cache = {
  load: async function (user: User) {
    if (user.appData) return;
    if (user.id in promises) {
      return promises[user.id];
    }

    promises[user.id] = new Promise(async (resolve, reject) => {
      try {
        await buildCache(user);
        delete promises[user.id];
        resolve();
      } catch (e) {
        delete promises[user.id];
        reject(e);
      }
    });

    return promises[user.id];
  },
};

const storage = {
  set: async function <K extends keyof user>(user: User, field: K, value: user[K]) {
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
  increment: async function <K extends Exclude<keyof user, 'userId'>>(
    user: User,
    field: K,
    value: user[K],
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
  let cache = await shardDb.query<user[]>(
    dbHost,
    `SELECT ${cachedFields.join(',')} FROM user WHERE userId = ${user.id}`,
  );

  if (cache.length > 0) cache = cache[0];
  else {
    if (!defaultCache) await loadDefaultCache(dbHost);
    cache = Object.assign({}, defaultCache);
  }

  cache.dbHost = dbHost;
  user.appData = cache;
}

async function getDbHost(userId: string): Promise<string> {
  let res = await managerDb.query(
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
  let res = await shardDb.query(
    dbHost,
    `SELECT ${cachedFields.join(',')} FROM user WHERE userId = 0`,
  );

  if (res.length == 0) await shardDb.query(dbHost, `INSERT IGNORE INTO user (userId) VALUES (0)`);

  res = await shardDb.query(dbHost, `SELECT ${cachedFields.join(',')} FROM user WHERE userId = 0`);

  defaultCache = res[0];
}

export default { cache, storage };
