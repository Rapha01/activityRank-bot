import { getKeys } from 'const/config.js';
import { createPool, type Pool } from 'mysql2/promise';

const keys = getKeys();
let pool: Pool | null = null;

export async function getManagerDb() {}

export async function query<T>(sql: string) {
  return (await getManagerPool().query(sql))[0] as T;
}

export async function getConnection() {
  return await getManagerPool().getConnection();
}

export async function getAllDbHosts() {
  const hostField = process.env.NODE_ENV == 'production' ? 'hostIntern' : 'hostExtern';
  let res = await query<{ host: string }[]>(`SELECT ${hostField} AS host FROM dbShard`);

  return res.map((r) => r.host);
}

function getManagerPool() {
  pool ??= createPool({
    host: keys.managerHost,
    port: keys.managerPort ?? undefined,
    database: keys.managerDb.dbName,
    user: keys.managerDb.dbUser,
    password: keys.managerDb.dbPassword,
    supportBigNumbers: true,
  });

  return pool;
}

export async function mgrFetch<T extends any>(body: any, route: string, method: string) {
  try {
    const requestObject: RequestInit = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        authorization: keys.managerApiAuth,
      },
    };

    if (body !== null) requestObject.body = JSON.stringify(body);

    const fetchURL =
      'http://' + keys.managerHost + (keys.managerPort ? `:${keys.managerPort}` : '') + route;

    const res = await fetch(fetchURL, requestObject);

    return (await res.json()) as T;
  } catch (cause) {
    throw new Error('Failed to fetch data from Manager API', { cause });
  }
}

export default {
  query,
  getConnection,
  getAllDbHosts,
  fetch: mgrFetch,
};
