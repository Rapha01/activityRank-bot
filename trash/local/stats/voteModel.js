const localApi = require('../api.js');
const db = require('../db.js');

exports.addVote = function(guildId,userId,value) {
  return new Promise(async function (resolve, reject) {
    try {
      await exports.get(guildId,userId);
    } catch (e) { reject(e); }

    db.query(`UPDATE vote SET
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

        //console.log('Added votes to ' + userId + ' of guild ' + guildId);
        resolve();
      });
  });
}

exports.get = (guildId,userId) => {
  return new Promise(async function (resolve, reject) {
    try {
      const conditions = {guildid: guildId,userid: userId};
      let voteStat = await localApi.getSingle('vote',conditions);

      if (!voteStat) {
        await localApi.loadSingle('vote',conditions);
        voteStat = await localApi.getSingle('vote',conditions);
      }

      resolve(voteStat);
    } catch (e) { reject(e); }
  });
}
