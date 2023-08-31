import mysql from 'promise-mysql';
import managerDb from '../managerDb/managerDb.js';
import net from 'net';
import { get as getKeys } from '../../const/keys.js';
let keys = getKeys();
let dbuser,
  dbpassword,
  dbname,
  pools = {};

export const query = (dbHost, sql) => {
  return new Promise(async function (resolve, reject) {
    try {
      if (!pools[dbHost]) await createPool(dbHost);

      resolve(await pools[dbHost].query(sql));
    } catch (e) {
      reject(e);
    }
  });
};

export const queryAllHosts = (sql) => {
  return new Promise(async function (resolve, reject) {
    try {
      const hosts = await managerDb.getAllDbHosts();

      let aggregate = [];
      for (let host of hosts) {
        aggregate = aggregate.concat(await query(host, sql));
      }

      resolve(aggregate);
    } catch (e) {
      reject(e);
    }
  });
};

export const getConnection = (dbHost) => {
  return new Promise(async function (resolve, reject) {
    try {
      if (!pools[dbHost]) await createPool(dbHost);

      resolve(await pools[dbHost].getConnection(sql));
    } catch (e) {
      reject(e);
    }
  });
};

const createPool = (dbHost) => {
  return new Promise(async function (resolve, reject) {
    try {
      if (!pools[dbHost]) {
        if (!net.isIP(dbHost))
          return reject(
            'Query triggered without defined dbHost. dbHost: ' + dbHost + '.',
          );

        pools[dbHost] = await mysql.createPool({
          host: dbHost,
          user: keys.shardDb.dbUser,
          password: keys.shardDb.dbPassword,
          database: keys.shardDb.dbName,
          dateStrings: 'date',
          charset: 'utf8mb4',
          supportBigNumbers: true,
          bigNumberStrings: true,
          connectionLimit: 3,
        });

        pools[dbHost].on('error', function (err) {
          console.log('ShardDb pool error.');
          if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.log(
              'PROTOCOL_CONNECTION_LOST for shardDb @' + dbHost + '. Deleting connection.',
            );
            delete pools[dbHost];
          } else {
            throw err;
          }
        });

        console.log('Connected to dbShard ' + dbHost);
      }

      resolve(pools[dbHost]);
    } catch (e) {
      reject(e);
    }
  });
};

// GENERATED: start of generated content by `exports-to-default`.
// [GENERATED: exports-to-default:v0]

export default {
  query,
  queryAllHosts,
  getConnection,
};

// GENERATED: end of generated content by `exports-to-default`.
