import { createPool, type Pool } from 'mysql2/promise';
import { getAllDbHosts } from '../managerDb/managerDb.js';
import {
  DummyDriver,
  Kysely,
  MysqlAdapter,
  MysqlDialect,
  MysqlIntrospector,
  MysqlQueryCompiler,
  type CompiledQuery,
} from 'kysely';
import type { ShardDB } from 'models/types/kysely/shard.js';
import { keys } from 'const/config.js';

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
 * import { dummyDb, executeQueryAll } from 'shardDb.js';
 *
 * const q = dummyDb.selectFrom('user').selectAll();
 * const res = await executeQueryAll(q);
 * ```
 */
export async function executeQueryAll<D>(query: CompiledQuery<D>) {
  const hosts = await getAllDbHosts();

  const queries = hosts.map(async (host) => await getShardDb(host).executeQuery(query));
  const results = await Promise.all(queries);

  return results.flatMap((res) => res.rows);
}

/** @deprecated Prefer querying with Kysely and getShardDb() instead */
export async function query<T>(dbHost: string, sql: string): Promise<T> {
  const pool = pools.get(dbHost) ?? getShardInstance(dbHost).pool;
  return (await pool.query(sql))[0] as T;
}

/** @deprecated Prefer querying with Kysely and executeQueryAll() instead */
export async function queryAllHosts<T>(sql: string): Promise<T[]> {
  const hosts = await getAllDbHosts();

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
    bigNumberStrings: true,
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

export const dummyDb = new Kysely<ShardDB>({
  dialect: {
    createAdapter: () => new MysqlAdapter(),
    createDriver: () => new DummyDriver(),
    createIntrospector: (db) => new MysqlIntrospector(db),
    createQueryCompiler: () => new MysqlQueryCompiler(),
  },
});

export default {
  query,
  queryAllHosts,
};
