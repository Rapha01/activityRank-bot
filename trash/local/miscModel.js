const db = require('./db.js');

exports.getUniqueRankedUserIds = (guildId) => {
  return new Promise(async function (resolve, reject) {
    try {
      const textmessageUserIds = await getUserIds('textmessage',guildId);
      const voiceminuteUserIds = await getUserIds('voiceminute',guildId);
      const voteUserIds = await getUserIds('vote',guildId);
      const bonusUserIds = await getUserIds('bonus',guildId);

      const userIds = [...new Set([...textmessageUserIds, ...voiceminuteUserIds, ...voteUserIds, ...bonusUserIds])];
      resolve(userIds);
    } catch (e) { reject(e); }
  });
}

exports.getUniqueRankedChannelIds = (guildId) => {
  return new Promise(async function (resolve, reject) {
    try {
      const textmessageChannelIds = await getChannelIds('textmessage',guildId);
      const voiceminuteChannelIds = await getChannelIds('voiceminute',guildId);

      const channelIds = [...new Set([...textmessageChannelIds, ...voiceminuteChannelIds])];
      resolve(channelIds);
    } catch (e) { reject(e); }
  });
}

function getUserIds(tablename,guildId) {
  return new Promise(async function (resolve, reject) {
    try {
      db.query(`SELECT DISTINCT userid FROM ${tablename} WHERE guildid = ${guildId} AND alltime != 0`, function (err, results, fields) {
        if (err) return reject(err);

        const ids = [];
        for (result of results)
          ids.push(result.userid);

        resolve(ids);
      });
    } catch (e) { reject(e); }
  });
}

function getChannelIds(tablename,guildId) {
  return new Promise(async function (resolve, reject) {
    try {
      db.query(`SELECT DISTINCT channelid FROM ${tablename} WHERE guildid = ${guildId} AND alltime != 0`, function (err, results, fields) {
        if (err) return reject(err);

        const ids = [];
        for (result of results)
          ids.push(result.channelid);

        resolve(ids);
      });
    } catch (e) { reject(e); }
  });
}
