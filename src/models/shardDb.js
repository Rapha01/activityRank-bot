const mysql = require('promise-mysql');
const net = require('net');
let keys = require('../const/keys').get();
let dbuser,dbpassword,dbname,pools = {};

module.exports.query = (dbHost,sql) => {
  return new Promise(async function (resolve, reject) {
    try {
      if (!pools[dbHost])
        await createPool(dbHost);

      resolve(await pools[dbHost].query(sql));
    } catch (e) { reject(e); }
  });
};

module.exports.getConnection = (dbHost) => {
  return new Promise(async function (resolve, reject) {
    try {
      if (!pools[dbHost])
        await createPool(dbHost);

      resolve(await pools[dbHost].getConnection(sql));
    } catch (e) { reject(e); }
  });
};

const createPool = (dbHost) => {
  return new Promise(async function (resolve, reject) {
    try {
      if (!pools[dbHost]) {
        if (!net.isIP(dbHost))
          return reject('Query triggered without defined dbHost. dbHost: ' + dbHost + '.');

        pools[dbHost] = await mysql.createPool({
          host                : dbHost,
          user                : keys.shardDb.dbUser,
          password            : keys.shardDb.dbPassword,
          database            : keys.shardDb.dbName,
          dateStrings         : 'date',
          charset             : 'utf8mb4',
          supportBigNumbers   : true,
          bigNumberStrings    : true
        });

        pools[dbHost].on('error', function(err) {
          console.log('ShardDb pool error.');
          if(err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.log('PROTOCOL_CONNECTION_LOST for shardDb @' + dbHost + '. Deleting connection.');
            delete pools[dbHost];
          } else { throw err; }
        });

        console.log('Connected to dbShard ' + dbHost);
      }

      resolve(pools[dbHost]);
    } catch (e) { reject(e); }
  });
};
