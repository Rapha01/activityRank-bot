import { createPool, type Pool } from 'mysql2/promise';
import { keys } from '../const/keys.js';

let pool: Pool | null = null;

/** ! Remember to close the connection after use. */
export async function getManagerConnection() {
  return await getManagerPool().getConnection();
}

export async function queryManager<T>(sql: string): Promise<T> {
  const pool = getManagerPool();
  return (await pool.query(sql))[0] as T;
}

export async function getAllDbHosts() {
  const res = await queryManager<{ host: string }[]>('SELECT host FROM dbShard');

  return res.map((r) => r.host);
}

function getManagerPool() {
  pool ??= createPool({
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
