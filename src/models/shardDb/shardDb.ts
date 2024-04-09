import { createPool, type Pool } from 'mysql2/promise';
import managerDb, { getAllDbHosts } from '../managerDb/managerDb.js';
import { getKeys } from 'const/config.js';
import { Kysely, MysqlDialect, type CompiledQuery } from 'kysely';
import type { ShardDB } from 'models/types/kysely/shard.js';

const keys = getKeys();
const pools: Map<string, Pool> = new Map();
const instances: Map<string, { db: Kysely<ShardDB>; pool: Pool }> = new Map();

export function getShardDb(host: string) {
  return getShardInstance(host).db;
}

/** ! Remember to close the connection after use. */
export async function getShardConnection(host: string) {
  return await getShardInstance(host).pool.getConnection();
}

/**
 * Execute a query on all database hosts.
 * @example ```ts
 * const q = getShardDb('any_host').selectFrom('user').selectAll();
 * const res = await kQueryAll(q);
 * ```
 */
export async function executeQueryAll<D>(query: CompiledQuery<D>) {
  const hosts = await getAllDbHosts();

  return await Promise.all(hosts.map(async (host) => await getShardDb(host).executeQuery(query)));
}

/** @deprecated Prefer querying with Kysely and getShardDb() instead */
export async function query<T>(dbHost: string, sql: string): Promise<T> {
  const pool = pools.get(dbHost) ?? getShardInstance(dbHost).pool;
  return (await pool.query(sql))[0] as T;
}

/** @deprecated Prefer querying with Kysely and executeQueryAll() instead */
export async function queryAllHosts<T>(sql: string): Promise<T[]> {
  const hosts = await managerDb.getAllDbHosts();

  let aggregate: T[] = [];
  for (let host of hosts) {
    aggregate = aggregate.concat(await query<T>(host, sql));
  }

  return aggregate;
}

function getShardInstance(host: string) {
  if (instances.has(host)) return instances.get(host)!;

  const pool = createPool({
    host: host,
    user: keys.shardDb.dbUser,
    password: keys.shardDb.dbPassword,
    database: keys.shardDb.dbName,
    charset: 'utf8mb4',
    supportBigNumbers: true,
    connectionLimit: 3,
  });

  // `pool.pool` is fed into Kysely because it operates on callback-based
  // pools, not the promise-based ones we use elsewhere.
  const instance = {
    pool,
    db: new Kysely<ShardDB>({ dialect: new MysqlDialect({ pool: pool.pool }) }),
  };

  instances.set(host, instance);
  return instance;
}

export default {
  query,
  queryAllHosts,
};
