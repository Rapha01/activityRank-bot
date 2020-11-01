const shardDb = require('../../models/shardDb/shardDb.js');
const managerDb = require('../../models/managerDb/managerDb.js');
const mysql = require('promise-mysql');
const fct = require('../../util/fct.js');

const promises = {};
let defaultCache = null;
let defaultAll = null;
const cachedFields = [ 'userId' ];
exports.cache = {};
exports.storage = {};
const hostField = process.env.NODE_ENV == 'production' ? 'hostIntern' : 'hostExtern';

exports.cache.load = (user) => {
  if(!user.appData) {
    if(promises[user.id]) { return promises[user.id]; }

    promises[user.id] = new Promise(async (resolve,reject) => {
      try {
        await buildCache(user);
        delete promises[user.id];
        resolve();
      } catch (e) { delete promises[user.id]; reject(e); }
    });

    return promises[user.id];
  }

  return new Promise(async resolve => { resolve(); });
};

exports.storage.set = (user,field,value) => {
  return new Promise(async function (resolve, reject) {
    try {
      await shardDb.query(user.appData.dbHost,`INSERT INTO user (userId,${field}) VALUES (${user.id},${mysql.escape(value)}) ON DUPLICATE KEY UPDATE ${field} = ${mysql.escape(value)}`);

      if (cachedFields[field])
        user.appData[field] = value;

      return resolve();
    } catch (e) { reject(e); }
  });
};

exports.storage.increment = (user,field,value) => {
  return new Promise(async function (resolve, reject) {
    try {
      await shardDb.query(user.appData.dbHost,`INSERT INTO user (userId,${field}) VALUES (${user.id},DEFAULT(${field}) + ${mysql.escape(value)}) ON DUPLICATE KEY UPDATE ${field} = ${field} + ${mysql.escape(value)}`);

      if (cachedFields[field])
        user.appData[field] += value;

      return resolve();
    } catch (e) { reject(e); }
  });
};

exports.storage.get = (user) => {
  return new Promise(async function (resolve, reject) {
    try {
      const res = await shardDb.query(user.appData.dbHost,`SELECT * FROM user WHERE userId = ${user.id}`);
      if (res.length == 0) {
        if (!defaultAll) defaultAll = (await shardDb.query(user.appData.dbHost,`SELECT * FROM user WHERE userId = 0`))[0];
        return resolve(defaultAll);
      } else
        return resolve(res[0]);
    } catch (e) { reject(e); }
  });
};

const buildCache = (user) => {
  return new Promise(async function (resolve, reject) {
    try {
      let dbHost = await getDbHost(user.id);
      let cache = await shardDb.query(dbHost,`SELECT ${cachedFields.join(',')} FROM user WHERE userId = ${user.id}`);

      if (cache.length > 0)
        cache = cache[0];
      else {
        if (!defaultCache) await loadDefaultCache(dbHost);
        cache = Object.assign({}, defaultCache);
      }

      cache.dbHost = dbHost;
      user.appData = cache;

      resolve();
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

const loadDefaultCache = (dbHost) => {
  return new Promise(async function (resolve, reject) {
    try {
      let res = await shardDb.query(dbHost,`SELECT ${cachedFields.join(',')} FROM user WHERE userId = 0`);

      if (res.length == 0)
        await conn.query(dbHost,`INSERT IGNORE INTO user (userId) VALUES (0)`);

      res = await shardDb.query(dbHost,`SELECT ${cachedFields.join(',')} FROM user WHERE userId = 0`);

      defaultCache = res[0];
    } catch (e) { reject(e); }
  });
}
