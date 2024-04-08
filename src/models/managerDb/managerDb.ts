import { getKeys } from 'const/config.js';
import mysql from 'mysql2/promise';

const keys = getKeys();
let pool: mysql.Pool | null = null;

export async function query<T>(sql: string) {
  return (await createPool().query(sql))[0] as T;
}

export async function getConnection() {
  return await createPool().getConnection();
}

export async function getAllDbHosts() {
  const hostField = process.env.NODE_ENV == 'production' ? 'hostIntern' : 'hostExtern';
  let res = await query<{ host: string }[]>(`SELECT ${hostField} AS host FROM dbShard`);

  return res.map((r) => r.host);
}

function createPool(): mysql.Pool {
  pool ??= mysql.createPool({
    host: keys.managerHost,
    user: keys.managerDb.dbUser,
    password: keys.managerDb.dbPassword,
    database: keys.managerDb.dbName,
    charset: 'utf8mb4',
    supportBigNumbers: true,
    connectionLimit: 3,
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
