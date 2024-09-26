import mysql from 'promise-mysql';
import { getAllDbHosts } from './managerDb.js';
import { keys } from '../const/keys.js';

const pools = new Map<string, mysql.Pool>();

export async function queryShard<T>(dbHost: string, sql: string) {
  if (!pools.has(dbHost)) await createPool(dbHost);

  return await pools.get(dbHost)!.query<T>(sql);
}

export async function getShardPool(dbHost: string) {
  if (!pools.has(dbHost)) await createPool(dbHost);

  return pools.get(dbHost)!;
}

export async function queryAllHosts<T>(sql: string) {
  const hosts = await getAllDbHosts();

  let aggregate = [];
  for (let host of hosts) {
    aggregate.push(await queryShard<T>(host, sql));
  }

  return aggregate;
}

async function createPool(dbHost: string) {
  if (!pools.has(dbHost)) {
    const pool = await mysql.createPool({
      host: dbHost,
      user: keys.shardDb.dbUser,
      password: keys.shardDb.dbPassword,
      database: keys.shardDb.dbName,
      charset: 'utf8mb4',
      supportBigNumbers: true,
      connectionLimit: 3,
    });
    pools.set(dbHost, pool);

    pool.on('error', function (err) {
      console.log('ShardDb pool error.');
      if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.log(
          `PROTOCOL_CONNECTION_LOST for shardDb @${dbHost}. Deleting connection.`
        );
        pools.delete(dbHost);
      } else {
        throw err;
      }
    });

    console.log('Connected to dbShard ' + dbHost);
  }

  return pools.get(dbHost);
}
