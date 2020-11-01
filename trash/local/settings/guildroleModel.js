const db = require('../db.js');
const localApi = require('../api.js');

exports.get = (guildId,roleId) => {
  return new Promise(async function (resolve, reject) {
    try {
      const conditions = {guildid: guildId,roleid: roleId};
      let guildrole = await localApi.getSingle('guildrole',conditions);

      if (!guildrole) {
        await localApi.loadSingle('guildrole',conditions);
        guildrole = await localApi.getSingle('guildrole',conditions);
      }

      resolve(guildrole);
    } catch (e) { reject(e); }
  });
}

exports.set = (guildId,roleId,field,value) => {
  return new Promise(async function (resolve, reject) {
    try {
      await localApi.setSingle('guildrole',{guildid: guildId,roleid: roleId},field,value);
      resolve();
    } catch (e) { reject(e); }
  });
}

exports.getRoleassignments = (guildId) => {
  return new Promise(async function (resolve, reject) {
    db.query(`SELECT * FROM guildrole WHERE guildid = '${guildId}' AND (assignlevel != 0 OR deassignlevel != 0) ORDER BY assignlevel ASC`, function (err, results, fields) {
      if (err) return reject(err);

      return resolve(results);
    });
  });
}

exports.getRoleassignmentsByTypeAndLevel = (guildId,type,level) => {
  return new Promise(async function (resolve, reject) {
    db.query(`SELECT * FROM guildrole WHERE guildid = '${guildId}' AND ${type}=${level}`, function (err, results, fields) {
      if (err) return reject(err);

      return resolve(results);
    });
  });
}

exports.getNoxpRoleIds = (guildId) => {
  return new Promise(async function (resolve, reject) {
    db.query(`SELECT roleid FROM guildrole WHERE guildid = '${guildId}' AND noxp=1`, function (err, results, fields) {
      if (err) return reject(err);

      let ids = [];
      for (result of results)
        ids.push(result.roleid);

      return resolve(ids);
    });
  });
}

exports.addCount = function(guildId,roleId,type) {
  return new Promise(async function (resolve, reject) {

    db.query(`UPDATE guildrole SET
        ${type}alltime = ${type}alltime + 1,
        ${type}year = ${type}year + 1,
        ${type}month = ${type}month + 1,
        ${type}week = ${type}week + 1,
        ${type}day = ${type}day + 1,
        haschanged = 1
        WHERE guildid = '${guildId}' AND roleid = '${roleId}'`,
      async function (err, results, fields) {
        if (err) reject(err);

        //console.log('Added guildrole count ' + type + ' to role ' + roleId + ' of guild ' + guildId);
        resolve();
      });
  });
}
