const mysql = require('promise-mysql');
const net = require('net');
let keys = require('../const/keys').get();
let dbuser,dbpassword,dbname,conns = {};

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
          console.log('PROTOCOL_CONNECTION_LOST for shardDb @' + dbHost + '. Deleting connection.');
          if(err.code === 'PROTOCOL_CONNECTION_LOST') {
            delete conns[dbHost];
          } else { throw err; }
        });

        console.log('Connected to dbShard ' + dbHost);
        await refreshDefaults(conns[dbHost]);
      }

      resolve(conns[dbHost]);
    } catch (e) { reject(e); }
  });
};

const refreshDefaults = (conn) => {
  return new Promise(async function (resolve, reject) {
    try {
      await conn.query(`INSERT IGNORE INTO user (userId) VALUES (0)`);
      await conn.query(`INSERT IGNORE INTO guildMember (guildId,userId) VALUES (0,0)`);
      await conn.query(`INSERT IGNORE INTO guildChannel (guildId,channelId) VALUES (0,0)`);
      await conn.query(`INSERT IGNORE INTO guildRole (guildId,roleId) VALUES (0,0)`);

      resolve();
    } catch (e) { reject(e); }
  });
};
