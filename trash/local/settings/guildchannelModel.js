const db = require('../db.js');
const localApi = require('../api.js');

exports.get = (guildId,channelId) => {
  return new Promise(async function (resolve, reject) {
    try {
      const conditions = {guildid: guildId,channelid: channelId};
      let guildchannel = await localApi.getSingle('guildchannel',conditions);

      if (!guildchannel) {
        await localApi.loadSingle('guildchannel',conditions);
        guildchannel = await localApi.getSingle('guildchannel',conditions);
      }

      resolve(guildchannel);
    } catch (e) { reject(e); }
  });
}

exports.set = (guildId,channelId,field,value) => {
  return new Promise(async function (resolve, reject) {
    try {
      await localApi.setSingle('guildchannel',{guildid: guildId,channelid: channelId},field,value);
      resolve();
    } catch (e) { reject(e); }
  });
}

exports.getIgnorechannels = (guildId) => {
  return new Promise(async function (resolve, reject) {
    db.query(`SELECT * FROM guildchannel WHERE guildid = '${guildId}' AND noxp = 1`, function (err, results, fields) {
      if (err) return reject(err);

      return resolve(results);
    });
  });
}
