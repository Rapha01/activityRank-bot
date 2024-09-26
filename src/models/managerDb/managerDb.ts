import { createPool, type Pool } from 'mysql2/promise';
import { Kysely, MysqlDialect } from 'kysely';
import type { ManagerDB } from 'models/types/kysely/manager.js';
import { keys } from 'const/config.js';

let pool: Pool | null = null;
let db: Kysely<ManagerDB> | null = null;

export function getManagerDb() {
  const activePool = getManagerPool();
  db ??= new Kysely({ dialect: new MysqlDialect({ pool: activePool.pool }) });
  return db;
}

/** ! Remember to close the connection after use. */
export async function getManagerConnection() {
  return await getManagerPool().getConnection();
}

/** @deprecated Prefer querying with Kysely and getManagerDb() instead */
export async function query<T>(sql: string) {
  return (await getManagerPool().query(sql))[0] as T;
}

/** @deprecated Prefer getManagerConnection() instead */
export async function getConnection() {
  return await getManagerPool().getConnection();
}

export async function getAllDbHosts() {
  const db = getManagerDb();
  const res = await db.selectFrom('dbShard').select(`host`).execute();

  return res.map((r) => r.host);
}

function getManagerPool() {
  pool ??= createPool({
    host: keys.managerHost,
    database: keys.managerDb.dbName,
    user: keys.managerDb.dbUser,
    password: keys.managerDb.dbPassword,
    supportBigNumbers: true,
    bigNumberStrings: true,
  });

  return pool;
}

type APIPaths = 'texts' | 'stats';
type AutocompletePaths = `api/${APIPaths}`;

// this type signature allows any string, but also provides autocomplete
export async function managerFetch<T extends any>(
  route: AutocompletePaths,
  init: RequestInit,
): Promise<T>;
export async function managerFetch<T extends any>(route: string, init: RequestInit): Promise<T>;
export async function managerFetch<T extends any>(route: string, init: RequestInit): Promise<T> {
  try {
    const url = new URL(`http://${keys.managerHost}/${route}`);
    // number converts to string cleanly; null does not add a port
    url.port = keys.managerPort as unknown as string;

    const headers = new Headers(init.headers);
    headers.set('Content-Type', 'application/json');
    headers.set('Authorization', keys.managerApiAuth);

    const res = await fetch(url, { ...init, headers });
    return (await res.json()) as T;
  } catch (cause) {
    throw new Error('Failed to fetch data from Manager API', { cause });
  }
}

export default {
  query,
  getConnection,
  getAllDbHosts,
};
