import fetch from 'node-fetch';
import mysql from 'promise-mysql';
let keys = require('../../const/keys').get();
let dbHost, dbpassword, dbname, dbhost, pool;

export const query = (sql) => {
  return new Promise(async function (resolve, reject) {
    try {
      if (!pool) await createPool();

      resolve(await pool.query(sql));
    } catch (e) {
      reject(e);
    }
  });
};

export const getConnection = () => {
  return new Promise(async function (resolve, reject) {
    try {
      if (!pool) await createPool();

      resolve(await pool.getConnection());
    } catch (e) {
      reject(e);
    }
  });
};

export const getAllDbHosts = () => {
  return new Promise(async function (resolve, reject) {
    try {
      const hostField = process.env.NODE_ENV == 'production' ? 'hostIntern' : 'hostExtern';
      let res = await query(`SELECT ${hostField} AS host FROM dbShard`);

      const hosts = [];
      for (let row of res) hosts.push(row.host); 
      
      resolve(hosts);
    } catch (e) { reject(e); }
  });
};

const createPool = () => {
  return new Promise(async function (resolve, reject) {
    try {
      if (!pool) {
        pool = await mysql.createPool({
          host: keys.managerHost,
          user: keys.managerDb.dbUser,
          password: keys.managerDb.dbPassword,
          database: keys.managerDb.dbName,
          dateStrings: 'date',
          charset: 'utf8mb4',
          supportBigNumbers: true,
          bigNumberStrings: true,
          connectionLimit: 3,
        });

        pool.on('error', function (err) {
          console.log('ManagerDb pool error.');
          if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.log(
              'PROTOCOL_CONNECTION_LOST for manager @' +
                dbHost +
                '. Deleting connection.'
            );
            pool = null;
          } else {
            throw err;
          }
        });

        console.log('Connected to managerDb @' + keys.managerHost + '.');
      }

      resolve(pool);
    } catch (e) {
      reject(e);
    }
  });
};

export const fetch = (body, route, method) => {
  return new Promise(async function (resolve, reject) {
    try {
      let res;

      const requestObject = {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          authorization: keys.managerApiAuth,
        },
        //timeout: 12000,
      };

      if (body != null) requestObject.body = JSON.stringify(body);

      res = await fetch('http://' + keys.managerHost + route, requestObject);

      res = await res.json();
      if (res.error != null) return reject('Remote DB Error: ' + res.error);

      if (res.results) resolve(res.results);
      else resolve(res);
    } catch (e) {
      reject('Fetch Error in backup.api.call(): ' + e);
    }
  });
};
