const localApi = require('../api.js');
const db = require('../db.js');

exports.addVoiceminutes = function(guildId,userId,channelId,minutes) {
  return new Promise(async function (resolve, reject) {
    try {
      await exports.get(guildId,userId,channelId);
    } catch (e) { reject(e); }

    db.query(`UPDATE voiceminute SET
        alltime = alltime + ${minutes},
        year = year + ${minutes},
        month = month + ${minutes},
        week = week + ${minutes},
        day = day + ${minutes},
        datechanged = now(),
        datebackedup = IF(haschanged=0,now(),datebackedup),
        haschanged = 1
        WHERE guildid = '${guildId}' AND userid = '${userId}' AND channelid = '${channelId}'`,
      async function (err, results, fields) {
        if (err) reject(err);

        //console.log('Added voiceminutes to ' + userId + ' of guild ' + guildId);
        resolve();
      });
  });
}

exports.get = (guildId,userId,channelId) => {
  return new Promise(async function (resolve, reject) {
    try {
      const conditions = {guildid: guildId,userid: userId,channelid: channelId};
      let voiceStat = await localApi.getSingle('voiceminute',conditions);

      if (!voiceStat) {
        await localApi.loadSingle('voiceminute',conditions);
        voiceStat = await localApi.getSingle('voiceminute',conditions);
      }

      resolve(voiceStat);
    } catch (e) { reject(e); }
  });
}
