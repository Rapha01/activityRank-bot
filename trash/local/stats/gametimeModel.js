const localApi = require('../api.js');
const db = require('../db.js');

exports.addGametime = function(guildId,userId,game,minutes) {
  return new Promise(async function (resolve, reject) {
    try {
      await exports.get(guildId,userId,channelId);
    } catch (e) { reject(e); }

    db.query(`UPDATE gametime SET
        alltime = alltime + ${minutes},
        year = year + ${minutes},
        month = month + ${minutes},
        week = week + ${minutes},
        day = day + ${minutes},
        datechanged = now(),
        datebackedup = IF(haschanged=0,now(),datebackedup),
        haschanged = 1
        WHERE guildid = '${guildId}' AND userid = '${userId}' AND game = '${game}'`,
      async function (err, results, fields) {
        if (err) reject(err);

        //console.log('Added gametime for ' + game + ' to ' + userId + ' of guild ' + guildId);
        resolve();
      });
  });
}

exports.get = (guildId,userId,game) => {
  return new Promise(async function (resolve, reject) {
    try {
      const conditions = {guildid: guildId,userid: userId,game: game};
      let gametimeStat = await localApi.getSingle('gametime',conditions);

      if (!gametimeStat) {
        await localApi.loadSingle('gametime',conditions);
        gametimeStat = await localApi.getSingle('gametime',conditions);
      }

      resolve(gametimeStat);
    } catch (e) { reject(e); }
  });
}
