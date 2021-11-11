const mysql = require('promise-mysql');
const net = require('net');
let keys = require('../../const/keys').get();
let dbuser,dbpassword,dbname,pools = {};
let pool;

module.exports.query = (dbHost,sql) => {
  return new Promise(async function (resolve, reject) {
    try {
      if (!pool) {await createPool()};
      resolve(await pool.query(sql));
    } catch (e) { reject(e); }
  });
};

module.exports.getConnection = (dbHost) => {
  return new Promise(async function (resolve, reject) {
    try {
      if (!pool) {await createPool(dbHost)};
      resolve(await pool.getConnection(sql));
    } catch (e) { reject(e); }
  });
};

const createPool = (dbHost) => {
  return new Promise(async function (resolve, reject) {
    try {
      if (!pool) {

        pool = await mysql.createPool({
          host                : dbHost, 
          user                : keys.shardDb.dbUser,
          password            : keys.shardDb.dbPassword,
          database            : keys.shardDb.dbName,
          dateStrings         : 'date',
          charset             : 'utf8mb4',
          supportBigNumbers   : true,
          bigNumberStrings    : true,
          connectionLimit     : 3
        });

        pool.on('error', function(err) {
          console.log('ShardDb pool error.');
          if(err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.log('PROTOCOL_CONNECTION_LOST for shardDb @' + dbHost + '. Deleting connection.');
            pool = null;
          } else { throw err; }
        });

        console.log('Connected to dbShard ' + dbHost);
      }
      
      resolve(pool);
    } catch (e) { reject(e); }
  });
};
