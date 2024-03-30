import mysql from 'mysql2/promise';
import managerDb from '../managerDb/managerDb.js';
import { getKeys } from 'const/config.js';

const keys = getKeys();
const pools: Record<string, mysql.Pool> = {};

export async function query<T>(dbHost: string, sql: string) {
  if (!pools[dbHost]) await createPool(dbHost);
  return (await pools[dbHost]!.query(sql))[0] as T;
}

export async function queryAllHosts<T>(sql: string) {
  const hosts = await managerDb.getAllDbHosts();

  let aggregate: T[] = [];
  for (let host of hosts) {
    aggregate = aggregate.concat(await query<T>(host, sql));
  }

  return aggregate;
}

async function createPool(dbHost: string) {
  if (!pools[dbHost]) {
    pools[dbHost] = await mysql.createPool({
      host: dbHost,
      user: keys.shardDb.dbUser,
      password: keys.shardDb.dbPassword,
      database: keys.shardDb.dbName,
      charset: 'utf8mb4',
      supportBigNumbers: true,
      connectionLimit: 3,
    });

    console.log('Connected to dbShard ' + dbHost);
  }

  return pools[dbHost];
}

export default {
  query,
  queryAllHosts,
};
