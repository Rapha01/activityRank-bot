import mysql from 'promise-mysql';
import managerDb from '../managerDb/managerDb.js';
import { get as getKeys } from '../../const/keys.js';

let keys = getKeys();
const pools: Record<string, mysql.Pool> = {};

export async function query<T>(dbHost: string, sql: string) {
  if (!pools[dbHost]) await createPool(dbHost);
  return await pools[dbHost]!.query<T>(sql);
}

export async function queryAllHosts<T>(sql: string) {
  const hosts = await managerDb.getAllDbHosts();

  let aggregate: T[] = [];
  for (let host of hosts) {
    aggregate = aggregate.concat(await query<T>(host, sql));
  }

  return aggregate;
}

async function createPool(dbHost: string) {
  if (!pools[dbHost]) {
    pools[dbHost] = await mysql.createPool({
      host: dbHost,
      user: keys.shardDb.dbUser,
      password: keys.shardDb.dbPassword,
      database: keys.shardDb.dbName,
      dateStrings: ['DATE'],
      charset: 'utf8mb4',
      supportBigNumbers: true,
      bigNumberStrings: true,
      connectionLimit: 3,
    });

    pools[dbHost].on('error', function (err) {
      console.log('ShardDb pool error.');
      if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.log('PROTOCOL_CONNECTION_LOST for shardDb @' + dbHost + '. Deleting connection.');
        delete pools[dbHost];
      } else {
        throw err;
      }
    });

    console.log('Connected to dbShard ' + dbHost);
  }

  return pools[dbHost];
}

export default {
  query,
  queryAllHosts,
};
