const mysql = require('promise-mysql');
const fetch = require('node-fetch');
let keys = require('../../const/keys.js');

if (process.env.NODE_ENV == 'production')
  keys = keys.production;
else
  keys = keys.development;

let conn = null;

module.exports.query = (sql) => {
  return new Promise(async function (resolve, reject) {
    try {
      if (!conn)
        await module.exports.getConnection();

      const res = await conn.query(sql);

      resolve(res);
    } catch (e) { reject(e); }
  });
};

module.exports.getConnection = () => {
  return new Promise(async function (resolve, reject) {
    try {
      if (!conn) {
        conn = await mysql.createConnection({
          host                : keys.managerHost,
          user                : keys.managerDb.dbUser,
          password            : keys.managerDb.dbPassword,
          database            : keys.managerDb.dbName,
          dateStrings         : 'date',
          charset             : 'utf8mb4',
          supportBigNumbers   : true,
          bigNumberStrings    : true
        });

        conn.on('error', function(err) {
          console.log('PROTOCOL_CONNECTION_LOST for manager @' + keys.managerHost + '. Deleting connection.');
          if(err.code === 'PROTOCOL_CONNECTION_LOST') {
            conn = null;
          } else { throw err; }
        });

        console.log('Connected to manager ' + keys.managerHost);
      }

      resolve(conn);
    } catch (e) { reject(e); }
  });
};


exports.fetch = (body,route,method) => {
  return new Promise(async function (resolve, reject) {
    try {
      let res;

      const requestObject = {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'authorization': keys.managerApiAuth
        },
        //timeout: 12000,
      };

      if (body != null)
        requestObject.body = JSON.stringify(body);

      res = await fetch('http://' + keys.managerHost + route, requestObject);

      res = await res.json();
      if (res.error != null)
        return reject('Remote DB Error: ' + res.error);

      if(res.results)
        resolve(res.results);
      else
        resolve(res);
    } catch (e) { reject('Fetch Error in backup.api.call(): ' + e); }
  });
}
