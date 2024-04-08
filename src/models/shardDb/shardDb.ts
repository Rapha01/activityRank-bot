import { createPool, type Pool } from 'mysql2/promise';
import managerDb from '../managerDb/managerDb.js';
import { getKeys } from 'const/config.js';

const keys = getKeys();
const pools: Map<string, Pool> = new Map();

export async function query<T>(dbHost: string, sql: string): Promise<T> {
  const pool = pools.get(dbHost) ?? createPool(dbHost);
  return (await pool.query(sql))[0] as T;
}

export async function queryAllHosts<T>(sql: string): Promise<T[]> {
  const hosts = await managerDb.getAllDbHosts();

  let aggregate: T[] = [];
  for (let host of hosts) {
    aggregate = aggregate.concat(await query<T>(host, sql));
  }

  return aggregate;
}

function getShardPool(dbHost: string): Pool {
  if (pools.has(dbHost)) return pools.get(dbHost)!;

  const pool = createPool({
    host: dbHost,
    user: keys.shardDb.dbUser,
    password: keys.shardDb.dbPassword,
    database: keys.shardDb.dbName,
    charset: 'utf8mb4',
    supportBigNumbers: true,
    connectionLimit: 3,
  });

  pools.set(dbHost, pool);
  console.log('Connected to dbShard ' + dbHost);
  return pool;
}

export default {
  query,
  queryAllHosts,
};
