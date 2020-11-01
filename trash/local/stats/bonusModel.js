const localApi = require('../api.js');
const db = require('../db.js');

exports.addBonus = function(guildId,userId,value) {
  return new Promise(async function (resolve, reject) {
    try {
      await exports.get(guildId,userId);
    } catch (e) { reject(e); }

    db.query(`UPDATE bonus SET
        alltime = alltime + ${value},
        year = year + ${value},
        month = month + ${value},
        week = week + ${value},
        day = day + ${value},
        datechanged = now(),
        datebackedup = IF(haschanged=0,now(),datebackedup),
        haschanged = 1
        WHERE guildid = '${guildId}' AND userid = '${userId}'`,
      async function (err, results, fields) {
        if (err) reject(err);

        //console.log('Added bonus to ' + userId + ' of guild ' + guildId);
        resolve();
      });
  });
}

exports.get = (guildId,userId) => {
  return new Promise(async function (resolve, reject) {
    try {
      const conditions = {guildid: guildId,userid: userId};
      let bonusStat = await localApi.getSingle('bonus',conditions);

      if (!bonusStat) {
        await localApi.loadSingle('bonus',conditions);
        bonusStat = await localApi.getSingle('bonus',conditions);
      }

      resolve(bonusStat);
    } catch (e) { reject(e); }
  });
}
