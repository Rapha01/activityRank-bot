const mysql = require('promise-mysql');
let keys = require('../const/keys').get();
let dbHost,dbpassword,dbname,dbhost,pool;

module.exports.query = (sql) => {
  return new Promise(async function (resolve, reject) {
    try {
      if (!pool)
        await createPool();

      resolve(await pool.query(sql));
    } catch (e) { reject(e); }
  });
};

module.exports.getConnection = () => {
  return new Promise(async function (resolve, reject) {
    try {
      if (!pool)
        await module.exports.createPool();

      resolve(await pool.getConnection());
    } catch (e) { reject(e); }
  });
};

const createPool = () => {
  return new Promise(async function (resolve, reject) {
    try {
      if (!pool) {
        pool = await mysql.createPool({
          host                : keys.managerHost,
          user                : keys.managerDb.dbUser,
          password            : keys.managerDb.dbPassword,
          database            : keys.managerDb.dbName,
          dateStrings         : 'date',
          charset             : 'utf8mb4',
          supportBigNumbers   : true,
          bigNumberStrings    : true,
          connectionLimit     : 3
        });

        pool.on('error', function(err) {
          console.log('ManagerDb pool error.');
          if(err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.log('PROTOCOL_CONNECTION_LOST for manager @' + dbHost + '. Deleting connection.');
            pool = null;
          } else { throw err; }
        });

        console.log('Connected to managerDb @' + keys.managerHost + '.');
      }

      resolve(pool);
    } catch (e) { reject(e); }
  });
};
