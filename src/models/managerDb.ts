import mysql from 'promise-mysql';
import { keys } from '../const/keys.js';

let pool: mysql.Pool | null = null;

export async function queryManager<T>(sql: string) {
  if (!pool) await createPool();
  return await pool!.query<T>(sql);
}

export async function getConnection() {
  if (!pool) await createPool();
  return await pool!.getConnection();
}

export async function getAllDbHosts() {
  const res = await queryManager<{ host: string }[]>(
    `SELECT host FROM dbShard`
  );

  return res.map((row) => row.host);
}

async function createPool() {
  if (!pool) {
    pool = await mysql.createPool({
      host: keys.managerHost,
      user: keys.managerDb.dbUser,
      password: keys.managerDb.dbPassword,
      database: keys.managerDb.dbName,
      charset: 'utf8mb4',
      supportBigNumbers: true,
      connectionLimit: 3,
    });

    pool.on('error', function (err) {
      console.log('ManagerDb pool error.');
      if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.log(
          'PROTOCOL_CONNECTION_LOST for manager. Deleting connection.'
        );
        pool = null;
      } else {
        throw err;
      }
    });

    console.log(`Connected to managerDb @${keys.managerHost}.`);
  }

  return pool;
}
