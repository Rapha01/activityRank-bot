import { escape } from 'promise-mysql';
import { queryShard } from './shardDb.js';
import { queryManager } from './managerDb.js';

let defaultAll: any = null;

export async function setUser(userId: string, field: string, value: unknown) {
  const dbHost = await getDbHost(userId);
  await queryShard(
    dbHost,
    `INSERT INTO user (userId,${field}) VALUES (${escape(userId)},${escape(
      value
    )}) ON DUPLICATE KEY UPDATE ${field} = ${escape(value)}`
  );
}

export async function getUser(userId: string) {
  const dbHost = await getDbHost(userId);
  const res = await queryShard<unknown[]>(
    dbHost,
    `SELECT * FROM user WHERE userId = ${userId}`
  );

  if (res.length == 0) {
    if (!defaultAll)
      defaultAll = (
        await queryShard<any>(dbHost, `SELECT * FROM user WHERE userId = 0`)
      )[0];
    return defaultAll;
  } else {
    return res[0];
  }
}

async function getDbHost(userId: string) {
  let res = await queryManager<{ host: string }[]>(
    `SELECT host FROM userRoute LEFT JOIN dbShard ON userRoute.dbShardId = dbShard.id WHERE userId = ${userId}`
  );

  if (res.length < 1) {
    await queryManager(`INSERT INTO userRoute (userId) VALUES (${userId})`);
    res = await queryManager(
      `SELECT host FROM userRoute LEFT JOIN dbShard ON userRoute.dbShardId = dbShard.id WHERE userId = ${userId}`
    );
  }

  return res[0].host;
}
