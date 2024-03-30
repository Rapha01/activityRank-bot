import { getKeys } from 'const/config.js';
import mysql from 'mysql2/promise';

const keys = getKeys();
let pool: mysql.Pool | null = null;

export async function query<T>(sql: string) {
  if (!pool) await createPool();
  return (await pool!.query(sql))[0] as T;
}

export async function getConnection() {
  if (!pool) await createPool();
  return await pool!.getConnection();
}

export async function getAllDbHosts() {
  const hostField = process.env.NODE_ENV == 'production' ? 'hostIntern' : 'hostExtern';
  let res = (await query(`SELECT ${hostField} AS host FROM dbShard`)) as { host: string }[];

  const hosts = [];
  for (let row of res) hosts.push(row.host);

  return hosts;
}

async function createPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: keys.managerHost,
      user: keys.managerDb.dbUser,
      password: keys.managerDb.dbPassword,
      database: keys.managerDb.dbName,
      charset: 'utf8mb4',
      supportBigNumbers: true,
      connectionLimit: 3,
    });

    console.log(`Connected to managerDb @${keys.managerHost}.`);
  }

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
    throw new Error('Fetch error in backup.api.call()', { cause });
  }
}

export default {
  query,
  getConnection,
  getAllDbHosts,
  fetch: mgrFetch,
};
