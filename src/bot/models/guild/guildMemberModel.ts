import shardDb from '../../../models/shardDb/shardDb.js';
import mysql from 'promise-mysql';
import rankModel from '../rankModel.js';
import type { Guild, GuildMember } from 'discord.js';

const promises: Record<string, Promise<void>> = {};
// export const storage = {};

const cachedFields = ['notifyLevelupDm', 'reactionVote'] as const;
let defaultCache = null;
let defaultAll = null;

export const cache = {
  load: (member: GuildMember) => {
    if (!member.appData) {
      if (promises[member.guild.id + member.id]) {
        return promises[member.guild.id + member.id];
      }

      promises[member.guild.id + member.id] = new Promise(async (resolve, reject) => {
        try {
          await buildCache(member);
          delete promises[member.guild.id + member.id];
          resolve();
        } catch (e) {
          delete promises[member.guild.id + member.id];
          reject(e);
        }
      });

      return promises[member.guild.id + member.id];
    }

    return new Promise(async (resolve) => {
      resolve();
    });
  },
};

export const storage = {
  get: async (guild: Guild, userId: string) => {
    const res = await shardDb.query(
      guild.appData.dbHost,
      `SELECT * FROM guildMember WHERE guildId = ${guild.id} && userId = ${mysql.escape(userId)}`,
    );

    if (res.length == 0) {
      if (!defaultAll)
        defaultAll = (
          await shardDb.query(
            guild.appData.dbHost,
            `SELECT * FROM guildMember WHERE guildId = 0 AND userId = 0`,
          )
        )[0];
      return defaultAll;
    } else return res[0];
  },

  set: async (guild: Guild, userId: string, field: string, value: string) => {
    await shardDb.query(
      guild.appData.dbHost,
      `INSERT INTO guildMember (guildId,userId,${field}) VALUES (${guild.id},${mysql.escape(
        userId,
      )},${mysql.escape(value)}) ON DUPLICATE KEY UPDATE ${field} = ${mysql.escape(value)}`,
    );

    const member = guild.members.cache.get(userId);
    if (member && member.appData && cachedFields.indexOf(field) > -1) member.appData[field] = value;
  },

  increment: async (guild: Guild, userId: string, field: string, value: string) => {
    await shardDb.query(
      guild.appData.dbHost,
      `INSERT INTO guildMember (guildId,userId,${field}) VALUES (${guild.id},${mysql.escape(
        userId,
      )},${mysql.escape(value)}) ON DUPLICATE KEY UPDATE ${field} = ${field} + ${mysql.escape(
        value,
      )}`,
    );

    const member = guild.members.cache.get(userId);
    if (member && member.appData && cachedFields.indexOf(field) > -1)
      member.appData[field] += value * 1;
  },
};

export const getRankedUserIds = (guild: Guild) => {
  return new Promise(async function (resolve, reject) {
    try {
      const textmessageUserIds = await shardDb.query(
        guild.appData.dbHost,
        `SELECT DISTINCT userId FROM textMessage WHERE guildId = ${guild.id} AND alltime != 0`,
      );
      const voiceMinuteUserIds = await shardDb.query(
        guild.appData.dbHost,
        `SELECT DISTINCT userId FROM voiceMinute WHERE guildId = ${guild.id} AND alltime != 0`,
      );
      const voteUserIds = await shardDb.query(
        guild.appData.dbHost,
        `SELECT DISTINCT userId FROM vote WHERE guildId = ${guild.id} AND alltime != 0`,
      );
      const bonusUserIds = await shardDb.query(
        guild.appData.dbHost,
        `SELECT DISTINCT userId FROM bonus WHERE guildId = ${guild.id} AND alltime != 0`,
      );

      const ids = [
        ...new Set([...textmessageUserIds, ...voiceMinuteUserIds, ...voteUserIds, ...bonusUserIds]),
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

const buildCache = async (member: GuildMember) => {
  let cache = await shardDb.query(
    member.guild.appData.dbHost,
    `SELECT ${cachedFields.join(',')} FROM guildMember WHERE guildId = ${
      member.guild.id
    } AND userId = ${member.id}`,
  );

  if (cache.length > 0) cache = cache[0];
  else {
    if (!defaultCache) await loadDefaultCache(member.guild.appData.dbHost);
    cache = Object.assign({}, defaultCache);
  }

  cache.totalXp = parseInt(await rankModel.getGuildMemberTotalScore(member.guild, member.id));
  cache.lastTextMessageDate = 0;

  member.appData = cache;
};

const loadDefaultCache = async (dbHost: string) => {
  let res = await shardDb.query(
    dbHost,
    `SELECT ${cachedFields.join(',')} FROM guildMember WHERE guildId = 0 AND userId = 0`,
  );

  if (res.length == 0)
    await shardDb.query(dbHost, `INSERT IGNORE INTO guildMember (guildId,userId) VALUES (0,0)`);

  res = await shardDb.query(
    dbHost,
    `SELECT ${cachedFields.join(',')} FROM guildMember WHERE guildId = 0 AND userId = 0`,
  );

  defaultCache = res[0];
};

export default {
  cache,
  storage,
  getRankedUserIds,
};