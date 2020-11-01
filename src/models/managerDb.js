const mysql = require('promise-mysql');
let keys = require('../const/keys').get();
let dbHost,dbpassword,dbname,dbhost,conn;

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
          console.log('PROTOCOL_CONNECTION_LOST for manager @' + dbHost + '. Deleting connection.');
          if(err.code === 'PROTOCOL_CONNECTION_LOST') {
            conn = null;
          } else { throw err; }
        });

        console.log('Connected to ' + dbHost);
      }

      resolve(conn);
    } catch (e) { reject(e); }
  });
};
