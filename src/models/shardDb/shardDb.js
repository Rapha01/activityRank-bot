const mysql = require('promise-mysql');
const net = require('net');
let keys = require('../../const/keys.js').get();

let conns = {};

module.exports.query = (dbHost,sql) => {
  return new Promise(async function (resolve, reject) {
    try {
      if (!conns[dbHost])
        await module.exports.getConnection(dbHost);

      const res = await conns[dbHost].query(sql);

      resolve(res);
    } catch (e) { reject(e); }
  });
};

module.exports.getConnection = (dbHost) => {
  return new Promise(async function (resolve, reject) {
    try {
      if (!conns[dbHost]) {
        if (!net.isIP(dbHost))
          return reject('Query triggered without defined dbHost. dbHost: ' + dbHost + '.');

        conns[dbHost] = await mysql.createConnection({
          host                : dbHost,
          user                : keys.shardDb.dbUser,
          password            : keys.shardDb.dbPassword,
          database            : keys.shardDb.dbName,
          dateStrings         : 'date',
          charset             : 'utf8mb4',
          supportBigNumbers   : true,
          bigNumberStrings    : true
        });

        conns[dbHost].on('error', function(err) {
          console.log('DB Error: ' + err);

          if(err.code == 'PROTOCOL_CONNECTION_LOST') {
            console.log('PROTOCOL_CONNECTION_LOST for shardDb @' + dbHost + '. Deleting connection.');
            delete conns[dbHost];
          } else { throw err; }
        });

        console.log('Connected to dbShard ' + dbHost);
      }

      resolve(conns[dbHost]);
    } catch (e) { reject(e); }
  });
};
