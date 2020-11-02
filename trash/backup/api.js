const config = require('../../config.js');
const keys = require('../../keys.js').get();
const fetch = require('node-fetch');

let dBHost,dBApiAuth;

exports.getCreateSingle = (tablename,conditions) => {
  return new Promise(async function (resolve, reject) {
    try {
      const row = await exports.call(
          {tablename: tablename, conditions:conditions},
          '/api/getCreateSingle/',
          'post');

      resolve(row);
    } catch (e) { reject(e); }
  });
}

exports.getMulti = (tablename,conditions,from,to) => {
  return new Promise(async function (resolve, reject) {
    try {
      const rows = await exports.call(
          {tablename: tablename,conditions: conditions,from: from,to: to},
          '/api/getMulti/',
          'post');

      resolve(rows);
    } catch (e) { reject(e); }
  });
}

exports.setSingle = (tablename,conditions,field,value) => {
  return new Promise(async function (resolve, reject) {
    try {
      const res = await exports.call(
          {tablename:tablename,conditions:conditions,field:field,value:value},
          '/api/setSingle/',
          'put');

      resolve();
    } catch (e) { reject(e) }
  });
}

exports.getAll = (guildId,from,to) => {
  return new Promise(async function (resolve, reject) {
    try {
      const guildAll = await exports.call(
          {guildId: guildId,from: from,to: to},
          '/api/getAll/',
          'post');

      resolve(guildAll);
    } catch (e) { reject(e); }
  });
}

exports.setMulti = (tablename,rows) => {
  return new Promise(async function (resolve, reject) {
    let resJson,res;
    try {
      console.log('Updating ' + rows.length + ' rows for table ' + tablename + '.');
      const requestObject = {
        method: 'put',
        headers: {
          'Content-Type': 'application/json',
          'authorization': dBApiAuth
        },
        body: JSON.stringify({
          tablename: tablename,
          rows: rows
        })
      };

      resJson = await fetch(dBHost + '/api/setMulti', requestObject);
      res = await resJson.json();

      if (res.error != null)
        return reject('Remote DB Error: ' + res.error);

      console.log('Backed up ' + tablename + '. ' + rows.length + ' rows.');
      resolve();
    } catch (e) { console.log(resJson);reject(e); }
  });
}

exports.call = (body,route,method) => {
  return new Promise(async function (resolve, reject) {
    try {
      let res;

      const requestObject = {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'authorization': dBApiAuth
        },
        //timeout: 12000,
      };

      if (body != null)
        requestObject.body = JSON.stringify(body);

      res = await fetch(dBHost + route, requestObject);
      //console.log(res);
      res = await res.json();
      if (res.error != null)
        return reject('Remote DB Error: ' + res.error);

      if(res.results)
        resolve(res.results);
      else
        resolve(res);
    } catch (e) { reject('Fetch Error in backup.api.call(): ' + e); }
  });
}

exports.getDbSchema = () => {
  return new Promise(async function (resolve, reject) {
    try {
      const res = await exports.call(
          {},
          '/api/getDbSchema/',
          'post');

      resolve(res);
    } catch (e) { reject(e); }
  });
}

exports.resetGuildStats = (guildId) => {
  return new Promise(async function (resolve, reject) {
    try {
      await exports.call(
          {guildId: guildId},
          '/api/resetGuildStats/',
          'put');

      resolve();
    } catch (e) { reject(e); }
  });
}

exports.resetGuildSettings = (guildId) => {
  return new Promise(async function (resolve, reject) {
    try {
      await exports.call(
          {guildId: guildId},
          '/api/resetGuildSettings/',
          'put');

      resolve();
    } catch (e) { reject(e); }
  });
}

exports.resetGuildmembersStats = (guildId,userIds) => {
  return new Promise(async function (resolve, reject) {
    try {
      await exports.call(
          {
            guildId: guildId,
            userIds: userIds
          },
          '/api/resetGuildmembersStats/',
          'put');

      resolve();
    } catch (e) { reject(e); }
  });
}

exports.resetGuildchannelsStats = (guildId,channelIds) => {
  return new Promise(async function (resolve, reject) {
    try {
      await exports.call(
          {
            guildId: guildId,
            channelIds: channelIds
          },
          '/api/resetGuildchannelsStats/',
          'put');

      resolve();
    } catch (e) { reject(e); }
  });
}
