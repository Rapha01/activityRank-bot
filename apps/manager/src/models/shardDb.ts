import { createPool, type Pool } from 'mysql2/promise';
import { getAllDbHosts } from './managerDb.js';
import { keys } from '../const/keys.js';

const pools: Map<string, Pool> = new Map();

/** ! Remember to close the connection after use. */
export async function getShardConnection(host: string) {
  return await getShardPool(host).getConnection();
}

export async function queryShard<T>(dbHost: string, sql: string): Promise<T> {
  const pool = getShardPool(dbHost);
  return (await pool.query(sql))[0] as T;
}

export async function queryAllHosts<T>(sql: string): Promise<T[]> {
  const hosts = await getAllDbHosts();

  let aggregate: T[] = [];
  for (const host of hosts) {
    aggregate = aggregate.concat(await queryShard<T>(host, sql));
  }

  return aggregate;
}

export function getShardPool(host: string): Pool {
  if (pools.has(host)) return pools.get(host) as Pool;

  const pool = createPool({
    host: host,
    user: keys.shardDb.dbUser,
    password: keys.shardDb.dbPassword,
    database: keys.shardDb.dbName,
    charset: 'utf8mb4',
    supportBigNumbers: true,
    bigNumberStrings: true,
    connectionLimit: 3,
  });

  pools.set(host, pool);

  return pool;
}
