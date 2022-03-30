const shardDb = require('../../../models/shardDb/shardDb.js');
const mysql = require('promise-mysql');
const rankModel = require('../rankModel.js');
const fct = require('../../../util/fct.js');

const promises = {};
exports.cache = {};
exports.storage = {};

const cachedFields = ['noXp','assignLevel','deassignLevel','assignMessage','deassignMessage'];
let defaultCache = null;
let defaultAll = null;

exports.cache.load = (role) => {
  if(!role.appData) {
    if(promises[role.id]) { return promises[role.id]; }

    promises[role.id] = new Promise(async (resolve,reject) => {
      try {
        await buildCache(role);
        delete promises[role.id];
        resolve();
      } catch (e) { delete promises[role.id]; reject(e); }
    });

    return promises[role.id];
  }

  return new Promise(async resolve => { resolve(); });
};

exports.storage.get = (guild,roleId) => {
  return new Promise(async function (resolve, reject) {
    try {
      const res = await shardDb.query(guild.appData.dbHost,`SELECT * FROM guildRole WHERE guildId = ${guild.id} && roleId = ${mysql.escape(roleId)}`);

      if (res.length == 0) {
        if (!defaultAll) defaultAll = (await shardDb.query(guild.appData.dbHost,`SELECT * FROM guildRole WHERE guildId = 0 AND roleId = 0`))[0];
        return resolve(defaultAll);
      } else
        return resolve(res[0]);
    } catch (e) { reject(e); }
  });
};

exports.storage.set = (guild,roleId,field,value) => {
  return new Promise(async function (resolve, reject) {
    try {
      await shardDb.query(guild.appData.dbHost,`INSERT INTO guildRole (guildId,roleId,${field}) VALUES (${guild.id},${mysql.escape(roleId)},${mysql.escape(value)}) ON DUPLICATE KEY UPDATE ${field} = ${mysql.escape(value)}`);

      const role = guild.roles.cache.get(roleId);
      if (role && role.appData && cachedFields.indexOf(field) > -1)
        role.appData[field] = value;

      return resolve();
    } catch (e) { reject(e); }
  });
};

exports.storage.getRoleAssignments = (guild) => {
  return new Promise(async function (resolve, reject) {
    try {
      const res = await shardDb.query(guild.appData.dbHost,`SELECT * FROM guildRole WHERE guildId = ${guild.id} AND (assignLevel != 0 OR deassignLevel != 0) ORDER BY assignLevel ASC`);

      return resolve(res);
    } catch (e) { reject(e); }
  });
}

exports.storage.getRoleAssignmentsByLevel = (guild,type,level) => {
  return new Promise(async function (resolve, reject) {
    try {
      const res = await shardDb.query(guild.appData.dbHost,`SELECT * FROM guildRole WHERE guildId = ${guild.id} AND ${type} = ${mysql.escape(level)}`);

      return resolve(res);
    } catch (e) { reject(e); }
  });
}

exports.storage.getRoleAssignmentsByRole = (guild,roleId) => {
  return new Promise(async function (resolve, reject) {
    try {
      const res = await shardDb.query(guild.appData.dbHost,`SELECT * FROM guildRole WHERE guildId = ${guild.id} AND roleId = ${roleId}`);

      return resolve(res);
    } catch (e) { reject(e); }
  });
}

exports.getNoXpRoleIds = (guild) => {
  return new Promise(async function (resolve, reject) {
    try {
      const res = await shardDb.query(guild.appData.dbHost,`SELECT roleId FROM guildRole WHERE guildId = ${guild.id} AND noXp = 1`);

      let ids = [];
      for (let role of res)
        ids.push(role.roleId);

      return resolve(ids);
    } catch (e) { reject(e); }
  });
}

const buildCache = (role) => {
  return new Promise(async function (resolve, reject) {
    try {
      let cache = await shardDb.query(role.guild.appData.dbHost,`SELECT ${cachedFields.join(',')} FROM guildRole WHERE guildId = ${role.guild.id} AND roleId = ${role.id}`);

      if (cache.length > 0)
        cache = cache[0];
      else {
        if (!defaultCache) await loadDefaultCache(role.guild.appData.dbHost);
        cache = Object.assign({}, defaultCache);
      }

      role.appData = cache;
      resolve();
    } catch (e) { reject(e); }
  });
};

const loadDefaultCache = (dbHost) => {
  return new Promise(async function (resolve, reject) {
    try {
      let res = await shardDb.query(dbHost,`SELECT ${cachedFields.join(',')} FROM guildRole WHERE guildId = 0 AND roleId = 0`);

      if (res.length == 0)
        await shardDb.query(dbHost,`INSERT IGNORE INTO guildRole (guildId,roleId) VALUES (0,0)`);

      res = await shardDb.query(dbHost,`SELECT ${cachedFields.join(',')} FROM guildRole WHERE guildId = 0 AND roleId = 0`);

      defaultCache = res[0];
      return resolve();
    } catch (e) { reject(e); }
  });
}
