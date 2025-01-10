import { createPool, createConnection, type PoolOptions } from 'mysql2/promise';
import { Kysely, MysqlDialect } from 'kysely';
import type { ManagerDB } from './typings/manager.js';

export function createManagerInstance(options: PoolOptions) {
  const pool = createPool({
    supportBigNumbers: true,
    bigNumberStrings: true,
    ...options,
  });

  /**
   * The Kysely instance of this managerDB instance.
   */
  const db: Kysely<ManagerDB> = new Kysely({
    // `pool.pool` is fed into Kysely because it operates on callback-based
    // pools, not the promise-based ones we use elsewhere.
    dialect: new MysqlDialect({ pool: pool.pool }),
  });

  /**
   * Returns an async `mysql2.Connection` instance from the pool.
   *
   * WARNING: Remember to close the connection after use.
   * Forgetting this will leave the pool hanging due to exhaustion of the connection limit.
   * Using Kysely is probably a better idea.
   */
  async function getConnection() {
    return await pool.getConnection();
  }

  /**
   * Sends a query to fetch all `host` fields in the `dbShard` table.
   */
  async function getAllDbHosts() {
    const res = await db.selectFrom('dbShard').select('host').execute();
    return res.map(({ host }) => host);
  }

  /**
   * Attempts to create a connection to the database (with a default timeout of 2 seconds).
   * If it fails, an error will be thrown.
   */
  async function testConnection(timeout = 2_000) {
    const conn = await createConnection({ ...options, connectTimeout: 2_000 });
    await conn.end();
  }

  return { db, getConnection, getAllDbHosts, testConnection };
}

export type ManagerInstance = Awaited<ReturnType<typeof createManagerInstance>>;
