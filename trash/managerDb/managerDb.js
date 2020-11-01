const mysql = require('promise-mysql');
const config = require('../../config');
let dbUser,dbPassword,dbName,dbHost;

if (process.env.NODE_ENV == 'production') {
  dbHost = config.managerHost;
  dbUser = ''
  dbPassword = '';
  dbName = '';
} else {
  dbHost = config.managerHost;
  dbUser = '';
  dbPassword = '';
  dbName = '';
}

module.exports.query = (sql) => {
  return new Promise(async function (resolve, reject) {
    let conn;
    try {
      conn = await mysql.createConnection({
        host                : dbHost,
        user                : dbUser,
        password            : dbPassword,
        database            : dbName,
        dateStrings         : 'date',
        charset             : 'utf8mb4',
        supportBigNumbers   : true,
        bigNumberStrings    : true,
        timezone            : 'utc'
      });
    } catch (e) { return reject(e); }

    try {
      const res = await conn.query(sql);

      await conn.end();
      resolve(res);
    } catch (e) { conn.end(); reject(e); }
  });
};

module.exports.getConnection = () => {
  return new Promise(async function (resolve, reject) {
    try {
      resolve(await mysql.createConnection({
        host                : dbHost,
        user                : dbUser,
        password            : dbPassword,
        database            : dbName,
        dateStrings         : 'date',
        charset             : 'utf8mb4',
        supportBigNumbers   : true,
        bigNumberStrings    : true
      }));
    } catch (e) { reject(e); }
  });
};
