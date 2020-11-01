const localApi = require('../api.js');
const db = require('../db.js');

exports.addCommand = function(guildId,userId,command) {
  return new Promise(async function (resolve, reject) {
    try {
      await exports.get(guildId,userId,command);
    } catch (e) { reject(e); }

    db.query(`UPDATE command SET
        alltime = alltime + 1,
        year = year + 1,
        month = month + 1,
        week = week + 1,
        day = day + 1,
        datechanged = now(),
        datebackedup = IF(haschanged=0,now(),datebackedup),
        haschanged = 1
        WHERE guildid = '${guildId}' AND userid = '${userId}' AND command = '${command}'`,
      async function (err, results, fields) {
        if (err) reject(err);

        //console.log('Added command ' + command + ' to ' + userId + ' of guild ' + guildId);
        resolve();
      });
  });
}

exports.get = (guildId,userId,command) => {
  return new Promise(async function (resolve, reject) {
    try {
      const conditions = {guildid: guildId,userid: userId,command: command};
      let commandStat = await localApi.getSingle('command',conditions);

      if (!commandStat) {
        await localApi.loadSingle('command',conditions);
        commandStat = await localApi.getSingle('command',conditions);
      }

      resolve(commandStat);
    } catch (e) { reject(e); }
  });
}
