import { Kysely, MysqlDialect } from 'kysely';
import { createConnection, createPool, type PoolOptions } from 'mysql2';
import type { ManagerInstance } from './manager.ts';
import type { ShardDB } from './typings/shard.ts';

export function createShardInstanceManager(
  options: Omit<PoolOptions, 'host'>,
  manager: ManagerInstance,
) {
  const instances: Map<string, ShardInstance> = new Map();

  function get(dbHost: string) {
    const instance = instances.get(dbHost);
    if (instance) {
      return instance;
    }

    const newInstance = createShardInstance({ host: dbHost, ...options });
    instances.set(dbHost, newInstance);
    return newInstance;
  }

  /**
   * Execute a query on all database hosts. Queries are run in parallel where possible.
   * @example ```ts
   * const res = await shard.executeOnAllHosts(db => db.selectFrom('user').selectAll().execute());
   * ```
   */
  async function executeOnAllHosts<T>(callback: (instance: ShardInstance['db']) => Promise<T[]>) {
    const allHosts = await manager.getAllDbHosts();

    const queries = allHosts.map(async (host) => {
      const instance = get(host);
      return await callback(instance.db);
    });

    const results = await Promise.all(queries);
    return results.flat();
  }

  /**
   * Attempts to create a connection to each database host (with a default timeout of 2 seconds).
   * If any of them fails, an error will be thrown.
   */
  async function testConnections(timeout = 2_000) {
    await Promise.all([...instances.values()].map(async (i) => i.testConnection(timeout)));
  }

  return { get, executeOnAllHosts, testConnections };
}

export type ShardInstanceManager = Awaited<ReturnType<typeof createShardInstanceManager>>;

export function createShardInstance(options: PoolOptions) {
  const pool = createPool({
    supportBigNumbers: true,
    bigNumberStrings: true,
    ...options,
  });

  /**
   * The Kysely instance of this shardDB instance.
   */
  const db: Kysely<ShardDB> = new Kysely({ dialect: new MysqlDialect({ pool }) });

  /**
   * Returns an async `mysql2.Connection` instance from the pool.
   *
   * WARNING: Remember to close the connection after use.
   * Forgetting this will leave the pool hanging due to exhaustion of the connection limit.
   * Using Kysely is probably a better idea.
   *
   * This is especially dangerous because shards tend to have a low connection limit.
   */
  async function getConnection() {
    return await pool.promise().getConnection();
  }

  /**
   * Attempts to create a connection to the database (with a default timeout of 2 seconds).
   * If it fails, an error will be thrown.
   */
  async function testConnection(timeout = 2_000) {
    const conn = createConnection({ ...options, connectTimeout: timeout });
    await conn.promise().end();
  }

  /** @deprecated Prefer querying with Kysely */
  async function _query<T>(sql: string): Promise<T> {
    return (await pool.promise().query(sql))[0] as T;
  }

  return { db, getConnection, testConnection, _query };
}

export type ShardInstance = Awaited<ReturnType<typeof createShardInstance>>;
