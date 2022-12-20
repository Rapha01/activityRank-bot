const fct = require('../../util/fct.js');
const shardDb = require('../../models/shardDb/shardDb.js');

exports.storage = {};

// Storage

exports.storage.getLastActivities = (guild, userId, timestamp = false) => {
  return new Promise(async function (resolve, reject) {
    try {
      let lastActivities = {},
        res;
      res = await shardDb.query(
        guild.appData.dbHost,
        `SELECT changeDate FROM textMessage WHERE guildId = ${guild.id} AND userId = ${userId} ORDER BY changeDate DESC LIMIT 1`
      );
      if (timestamp)
        lastActivities.textMessage = res.length > 0 ? res[0].changeDate : null;
      else
        lastActivities.textMessage =
          res.length > 0
            ? new Date(res[0].changeDate * 1000).toString().slice(0, 16)
            : 'n/a';
      res = await shardDb.query(
        guild.appData.dbHost,
        `SELECT changeDate FROM voiceMinute WHERE guildId = ${guild.id} AND userId = ${userId} ORDER BY changeDate DESC LIMIT 1`
      );
      if (timestamp)
        lastActivities.voiceMinute = res.length > 0 ? res[0].changeDate : null;
      else
        lastActivities.voiceMinute =
          res.length > 0
            ? new Date(res[0].changeDate * 1000).toString().slice(0, 16)
            : 'n/a';
      res = await shardDb.query(
        guild.appData.dbHost,
        `SELECT changeDate FROM invite WHERE guildId = ${guild.id} AND userId = ${userId} ORDER BY changeDate DESC LIMIT 1`
      );
      if (timestamp)
        lastActivities.invite = res.length > 0 ? res[0].changeDate : null;
      else
        lastActivities.invite =
          res.length > 0
            ? new Date(res[0].changeDate * 1000).toString().slice(0, 16)
            : 'n/a';
      res = await shardDb.query(
        guild.appData.dbHost,
        `SELECT changeDate FROM vote WHERE guildId = ${guild.id} AND userId = ${userId} ORDER BY changeDate DESC LIMIT 1`
      );
      if (timestamp)
        lastActivities.vote = res.length > 0 ? res[0].changeDate : null;
      else
        lastActivities.vote =
          res.length > 0
            ? new Date(res[0].changeDate * 1000).toString().slice(0, 16)
            : 'n/a';
      res = await shardDb.query(
        guild.appData.dbHost,
        `SELECT changeDate FROM bonus WHERE guildId = ${guild.id} AND userId = ${userId} ORDER BY changeDate DESC LIMIT 1`
      );
      if (timestamp)
        lastActivities.bonus = res.length > 0 ? res[0].changeDate : null;
      else
        lastActivities.bonus =
          res.length > 0
            ? new Date(res[0].changeDate * 1000).toString().slice(0, 16)
            : 'n/a';

      resolve(lastActivities);
    } catch (e) {
      reject(e);
    }
  });
};
