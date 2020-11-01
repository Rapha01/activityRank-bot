const localApi = require('../api.js');
const db = require('../db.js');

exports.addMessageCount = function(guildId,userId,channelId,messages) {
  return new Promise(async function (resolve, reject) {
    try {
      await exports.get(guildId,userId,channelId);
    } catch (e) { reject(e); }

    db.query(`UPDATE textmessage SET
        alltime = alltime + ${messages},
        year = year + ${messages},
        month = month + ${messages},
        week = week + ${messages},
        day = day + ${messages},
        datechanged = now(),
        datebackedup = IF(haschanged=0,now(),datebackedup),
        haschanged = 1
        WHERE guildid = '${guildId}' AND userid = '${userId}' AND channelid = '${channelId}'`,
      async function (err, results, fields) {
        if (err) reject(err);

        //console.log('Added textpoints to ' + userId + ' of guild ' + guildId);
        resolve();
      });
  });
}

exports.get = (guildId,userId,channelId) => {
  return new Promise(async function (resolve, reject) {
    try {
      const conditions = {guildid: guildId,userid: userId,channelid: channelId};
      let textStat = await localApi.getSingle('textmessage',conditions);
      if (!textStat) {
        await localApi.loadSingle('textmessage',conditions);
        textStat = await localApi.getSingle('textmessage',conditions);
      }

      resolve(textStat);
    } catch (e) { reject(e); }
  });
}
