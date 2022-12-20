const shardDb = require("../../../models/shardDb/shardDb.js");
const mysql = require("promise-mysql");
const rankModel = require("../rankModel.js");
const fct = require("../../../util/fct.js");

const promises = {};
exports.cache = {};
exports.storage = {};

const cachedFields = ["noXp", "noCommand"];
let defaultCache = null;
let defaultAll = null;

exports.cache.load = (channel) => {
  if (!channel.appData) {
    if (promises[channel.id]) {
      return promises[channel.id];
    }

    promises[channel.id] = new Promise(async (resolve, reject) => {
      try {
        await buildCache(channel);
        delete promises[channel.id];
        resolve();
      } catch (e) {
        delete promises[channel.id];
        reject(e);
      }
    });

    return promises[channel.id];
  }

  return new Promise(async (resolve) => {
    resolve();
  });
};

exports.storage.get = (guild, channelId) => {
  return new Promise(async function (resolve, reject) {
    try {
      const res = await shardDb.query(
        guild.appData.dbHost,
        `SELECT * FROM guildChannel WHERE guildId = ${
          guild.id
        } && channelId = ${mysql.escape(channelId)}`
      );

      if (res.length == 0) {
        if (!defaultAll)
          defaultAll = (
            await shardDb.query(
              guild.appData.dbHost,
              `SELECT * FROM guildChannel WHERE guildId = 0 AND channelId = 0`
            )
          )[0];
        return resolve(defaultAll);
      } else return resolve(res[0]);
    } catch (e) {
      reject(e);
    }
  });
};

exports.storage.set = (guild, channelId, field, value) => {
  return new Promise(async function (resolve, reject) {
    try {
      await shardDb.query(
        guild.appData.dbHost,
        `INSERT INTO guildChannel (guildId,channelId,${field}) VALUES (${
          guild.id
        },${mysql.escape(channelId)},${mysql.escape(
          value
        )}) ON DUPLICATE KEY UPDATE ${field} = ${mysql.escape(value)}`
      );

      const channel = guild.channels.cache.get(channelId);
      if (channel && channel.appData && cachedFields.indexOf(field) > -1)
        channel.appData[field] = value;

      return resolve();
    } catch (e) {
      reject(e);
    }
  });
};

exports.getRankedChannelIds = (guild) => {
  return new Promise(async function (resolve, reject) {
    try {
      const textmessageUserIds = await shardDb.query(
        guild.appData.dbHost,
        `SELECT DISTINCT channelId FROM textMessage WHERE guildId = ${guild.id} AND alltime != 0`
      );
      const voiceMinuteUserIds = await shardDb.query(
        guild.appData.dbHost,
        `SELECT DISTINCT channelId FROM voiceMinute WHERE guildId = ${guild.id} AND alltime != 0`
      );

      const ids = [...new Set([...textmessageUserIds, ...voiceMinuteUserIds])];

      let channelIds = [];
      for (let id of ids) {
        channelIds.push(id.channelId);
      }

      resolve(channelIds);
    } catch (e) {
      reject(e);
    }
  });
};

exports.getNoXpChannelIds = (guild) => {
  return new Promise(async function (resolve, reject) {
    try {
      const res = await shardDb.query(
        guild.appData.dbHost,
        `SELECT channelId FROM guildChannel WHERE guildId = ${guild.id} AND noXp = 1`
      );

      let ids = [];
      for (let channel of res) ids.push(channel.channelId);

      resolve(ids);
    } catch (e) {
      reject(e);
    }
  });
};

exports.getNoCommandChannelIds = (guild) => {
  return new Promise(async function (resolve, reject) {
    try {
      const res = await shardDb.query(
        guild.appData.dbHost,
        `SELECT channelId FROM guildChannel WHERE guildId = ${guild.id} AND noCommand = 1`
      );

      let ids = [];
      for (let channel of res) ids.push(channel.channelId);

      resolve(ids);
    } catch (e) {
      reject(e);
    }
  });
};

const buildCache = (channel) => {
  return new Promise(async function (resolve, reject) {
    try {
      let cache = await shardDb.query(
        channel.guild.appData.dbHost,
        `SELECT ${cachedFields.join(",")} FROM guildChannel WHERE guildId = ${
          channel.guild.id
        } AND channelId = ${channel.id}`
      );

      if (cache.length > 0) cache = cache[0];
      else {
        if (!defaultCache) await loadDefaultCache(channel.guild.appData.dbHost);
        cache = Object.assign({}, defaultCache);
      }

      channel.appData = cache;
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
        )} FROM guildChannel WHERE guildId = 0 AND channelId = 0`
      );

      if (res.length == 0)
        await shardDb.query(
          dbHost,
          `INSERT IGNORE INTO guildChannel (guildId,channelId) VALUES (0,0)`
        );

      res = await shardDb.query(
        dbHost,
        `SELECT ${cachedFields.join(
          ","
        )} FROM guildChannel WHERE guildId = 0 AND channelId = 0`
      );

      defaultCache = res[0];
      return resolve();
    } catch (e) {
      reject(e);
    }
  });
};
