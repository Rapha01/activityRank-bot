const shardDb = require('./shardDb.js');
const managerDb = require('./managerDb.js');
const mysql = require('promise-mysql');

const promises = {};
exports.storage = {};
const hostField = process.env.NODE_ENV == 'production' ? 'hostIntern' : 'hostExtern';
let defaultAll = null;

exports.storage.set = (userId,field,value) => {
  return new Promise(async function (resolve, reject) {
    try {
      const dbHost = await getDbHost(userId);
      await shardDb.query(dbHost,`INSERT INTO user (userId,${field}) VALUES (${mysql.escape(userId)},${mysql.escape(value)}) ON DUPLICATE KEY UPDATE ${field} = ${mysql.escape(value)}`);

      return resolve();
    } catch (e) { reject(e); }
  });
};

exports.storage.increment = (userId,field,value) => {
  return new Promise(async function (resolve, reject) {
    try {
      const dbHost = await getDbHost(userId);
      await shardDb.query(dbHost,`INSERT INTO user (userId,${field}) VALUES (${userId},DEFAULT(${field}) + ${mysql.escape(value)}) ON DUPLICATE KEY UPDATE ${field} = ${field} + ${mysql.escape(value)}`);

      return resolve();
    } catch (e) { reject(e); }
  });
};

exports.storage.get = (userId) => {
  return new Promise(async function (resolve, reject) {
    try {
      const dbHost = await getDbHost(userId);
      const res = await shardDb.query(dbHost,`SELECT * FROM user WHERE userId = ${userId}`);
      if (res.length == 0) {
        if (!defaultAll) defaultAll = (await shardDb.query(dbHost,`SELECT * FROM user WHERE userId = 0`))[0];
        return resolve(defaultAll);
      } else
        return resolve(res[0]);
    } catch (e) { reject(e); }
  });
};

const getDbHost = (userId) => {
  return new Promise(async function (resolve, reject) {
    try {
      let res = await managerDb.query(`SELECT ${hostField} AS host FROM userRoute LEFT JOIN dbShard ON userRoute.dbShardId = dbShard.id WHERE userId = ${userId}`);

      if (res.length < 1) {
         await managerDb.query(`INSERT INTO userRoute (userId) VALUES (${userId})`);
         res = await managerDb.query(`SELECT ${hostField} AS host FROM userRoute LEFT JOIN dbShard ON userRoute.dbShardId = dbShard.id WHERE userId = ${userId}`);
      }

      resolve(res[0].host);
    } catch (e) { reject(e); }
  });
}
