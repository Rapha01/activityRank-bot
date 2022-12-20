const shardDb = require("../../../models/shardDb/shardDb.js");
const mysql = require("promise-mysql");
const rankModel = require("../rankModel.js");
const fct = require("../../../util/fct.js");

const promises = {};
exports.cache = {};
exports.storage = {};

const cachedFields = ["notifyLevelupDm", "reactionVote"];
let defaultCache = null;
let defaultAll = null;

exports.cache.load = (member) => {
  if (!member.appData) {
    if (promises[member.guild.id + member.id]) {
      return promises[member.guild.id + member.id];
    }

    promises[member.guild.id + member.id] = new Promise(
      async (resolve, reject) => {
        try {
          await buildCache(member);
          delete promises[member.guild.id + member.id];
          resolve();
        } catch (e) {
          delete promises[member.guild.id + member.id];
          reject(e);
        }
      }
    );

    return promises[member.guild.id + member.id];
  }

  return new Promise(async (resolve) => {
    resolve();
  });
};

exports.storage.get = (guild, userId) => {
  return new Promise(async function (resolve, reject) {
    try {
      const res = await shardDb.query(
        guild.appData.dbHost,
        `SELECT * FROM guildMember WHERE guildId = ${
          guild.id
        } && userId = ${mysql.escape(userId)}`
      );

      if (res.length == 0) {
        if (!defaultAll)
          defaultAll = (
            await shardDb.query(
              guild.appData.dbHost,
              `SELECT * FROM guildMember WHERE guildId = 0 AND userId = 0`
            )
          )[0];
        return resolve(defaultAll);
      } else return resolve(res[0]);
    } catch (e) {
      reject(e);
    }
  });
};

exports.storage.set = (guild, userId, field, value) => {
  return new Promise(async function (resolve, reject) {
    try {
      await shardDb.query(
        guild.appData.dbHost,
        `INSERT INTO guildMember (guildId,userId,${field}) VALUES (${
          guild.id
        },${mysql.escape(userId)},${mysql.escape(
          value
        )}) ON DUPLICATE KEY UPDATE ${field} = ${mysql.escape(value)}`
      );

      const member = guild.members.cache.get(userId);
      if (member && member.appData && cachedFields.indexOf(field) > -1)
        member.appData[field] = value;

      return resolve();
    } catch (e) {
      reject(e);
    }
  });
};

exports.storage.increment = (guild, userId, field, value) => {
  return new Promise(async function (resolve, reject) {
    try {
      await shardDb.query(
        guild.appData.dbHost,
        `INSERT INTO guildMember (guildId,userId,${field}) VALUES (${
          guild.id
        },${mysql.escape(userId)},${mysql.escape(
          value
        )}) ON DUPLICATE KEY UPDATE ${field} = ${field} + ${mysql.escape(
          value
        )}`
      );

      const member = guild.members.cache.get(userId);
      if (member && member.appData && cachedFields.indexOf(field) > -1)
        member.appData[field] += value * 1;

      return resolve();
    } catch (e) {
      reject(e);
    }
  });
};

exports.getRankedUserIds = (guild) => {
  return new Promise(async function (resolve, reject) {
    try {
      const textmessageUserIds = await shardDb.query(
        guild.appData.dbHost,
        `SELECT DISTINCT userId FROM textMessage WHERE guildId = ${guild.id} AND alltime != 0`
      );
      const voiceMinuteUserIds = await shardDb.query(
        guild.appData.dbHost,
        `SELECT DISTINCT userId FROM voiceMinute WHERE guildId = ${guild.id} AND alltime != 0`
      );
      const voteUserIds = await shardDb.query(
        guild.appData.dbHost,
        `SELECT DISTINCT userId FROM vote WHERE guildId = ${guild.id} AND alltime != 0`
      );
      const bonusUserIds = await shardDb.query(
        guild.appData.dbHost,
        `SELECT DISTINCT userId FROM bonus WHERE guildId = ${guild.id} AND alltime != 0`
      );

      const ids = [
        ...new Set([
          ...textmessageUserIds,
          ...voiceMinuteUserIds,
          ...voteUserIds,
          ...bonusUserIds,
        ]),
      ];

      let userIds = [];
      for (let id of ids) {
        userIds.push(id.userId);
      }

      resolve(userIds);
    } catch (e) {
      reject(e);
    }
  });
};

const buildCache = (member) => {
  return new Promise(async function (resolve, reject) {
    try {
      let cache = await shardDb.query(
        member.guild.appData.dbHost,
        `SELECT ${cachedFields.join(",")} FROM guildMember WHERE guildId = ${
          member.guild.id
        } AND userId = ${member.id}`
      );

      if (cache.length > 0) cache = cache[0];
      else {
        if (!defaultCache) await loadDefaultCache(member.guild.appData.dbHost);
        cache = Object.assign({}, defaultCache);
      }

      cache.totalXp = parseInt(
        await rankModel.getGuildMemberTotalScore(member.guild, member.id)
      );
      cache.lastTextMessageDate = 0;

      member.appData = cache;
      resolve();
    } catch (e) {
      reject(e);
    }
  });
};

const loadDefaultCache = (dbHost) => {
  return new Promise(async function (resolve, reject) {
    try {
      let res = await shardDb.query(
        dbHost,
        `SELECT ${cachedFields.join(
          ","
        )} FROM guildMember WHERE guildId = 0 AND userId = 0`
      );

      if (res.length == 0)
        await shardDb.query(
          dbHost,
          `INSERT IGNORE INTO guildMember (guildId,userId) VALUES (0,0)`
        );

      res = await shardDb.query(
        dbHost,
        `SELECT ${cachedFields.join(
          ","
        )} FROM guildMember WHERE guildId = 0 AND userId = 0`
      );

      defaultCache = res[0];
      return resolve();
    } catch (e) {
      reject(e);
    }
  });
};
