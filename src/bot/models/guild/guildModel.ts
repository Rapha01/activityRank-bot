import shardDb from '../../../models/shardDb/shardDb.js';
import managerDb from '../../../models/managerDb/managerDb.js';
import mysql from 'promise-mysql';
import fct from '../../../util/fct.js';
import type { Guild } from 'discord.js';

const promises = {};
export const cache = {};
export const storage = {};

const hostField = process.env.NODE_ENV == 'production' ? 'hostIntern' : 'hostExtern';
const cachedFields = [
  //'tokens',
  'showNicknames',
  'textXp',
  'voiceXp',
  'inviteXp',
  'voteXp',
  'bonusXp',
  'textMessageCooldownSeconds',
  'voteCooldownSeconds',
  'xpPerTextMessage',
  'xpPerVoiceMinute',
  'voteTag',
  'voteEmote',
  'bonusTag',
  'bonusEmote',
  'entriesPerPage',
  'xpPerVote',
  'xpPerInvite',
  'xpPerBonus',
  'bonusPerTextMessage',
  'bonusPerVoiceMinute',
  'bonusPerVote',
  'bonusPerInvite',
  'bonusUntilDate',
  'levelFactor',
  'reactionVote',
  'allowMutedXp',
  'allowSoloXp',
  'allowInvisibleXp',
  'allowDeafenedXp',
  'notifyLevelupDm',
  'notifyLevelupWithRole',
  'notifyLevelupCurrentChannel',
  'takeAwayAssignedRolesOnLevelDown',
  'roleAssignMessage',
  'roleDeassignMessage',
  'commandOnlyChannel',
  'autopost_serverJoin',
  'autopost_levelup',
  'levelupMessage',
  'serverJoinMessage',
  'addDate',
  'isBanned',
];

cache.load = (guild) => {
  if (!guild.appData) {
    if (promises[guild.id]) return promises[guild.id];

    promises[guild.id] = new Promise(async (resolve, reject) => {
      try {
        await buildCache(guild);
        delete promises[guild.id];
        resolve();
      } catch (e) {
        delete promises[guild.id];
        reject(e);
      }
    });

    return promises[guild.id];
  }

  return new Promise(async (resolve) => {
    resolve();
  });
};

storage.set = (guild: Guild, field, value) => {
  return new Promise(async function (resolve, reject) {
    try {
      await shardDb.query(
        guild.appData.dbHost,
        `UPDATE guild SET ${field} = ${mysql.escape(value)} WHERE guildId = ${guild.id}`,
      );

      if (cachedFields.indexOf(field) > -1) guild.appData[field] = value;

      return resolve();
    } catch (e) {
      reject(e);
    }
  });
};

storage.increment = (guild, field, value) => {
  return new Promise(async function (resolve, reject) {
    try {
      await shardDb.query(
        guild.appData.dbHost,
        `UPDATE guild SET ${field} = ${field} + ${mysql.escape(value)} WHERE guildId = ${guild.id}`,
      );

      if (cachedFields.indexOf(field) > -1) guild.appData[field] += value * 1;

      return resolve();
    } catch (e) {
      reject(e);
    }
  });
};

storage.get = (guild) => {
  return new Promise(async function (resolve, reject) {
    try {
      const res = await shardDb.query(
        guild.appData.dbHost,
        `SELECT * FROM guild WHERE guildId = ${guild.id}`,
      );
      if (res.length == 0) return resolve(null);
      else return resolve(res[0]);
    } catch (e) {
      reject(e);
    }
  });
};

export interface CachedGuildStore {
  tokens: number;
  tokensBurned: number;
  voteTag: string;
  voteEmote: string;
  bonusTag: string;
  bonusEmote: string;
  entriesPerPage: number;
  showNicknames: boolean;
  textXp: boolean;
  voiceXp: boolean;
  inviteXp: boolean;
  voteXp: boolean;
  bonusXp: boolean;
  notifyLevelupDm: boolean;
  notifyLevelupCurrentChannel: boolean;
  notifyLevelupWithRole: boolean;
  notifyLevelupOnlyWithRole: boolean;
  takeAwayAssignedRolesOnLevelDown: boolean;
  levelFactor: number;
  voteCooldownSeconds: number;
  textMessageCooldownSeconds: number;
  xpPerVoiceMinute: number;
  xpPerTextMessage: number;
  xpPerVote: number;
  xpPerInvite: number;
  xpPerBonus: number;
  bonusPerTextMessage: number;
  bonusPerVoiceMinute: number;
  bonusPerVote: number;
  bonusPerInvite: number;
  bonusUntilDate: string;
  reactionVote: boolean;
  allowMutedXp: boolean;
  allowDeafenedXp: boolean;
  allowSoloXp: boolean;
  allowInvisibleXp: boolean;
  allowDownvotes: boolean;
  commandOnlyChannel?: string;
  autopost_levelup?: string;
  autopost_serverJoin?: string;
  autopost_serverLeave?: string;
  autopost_voiceChannelJoin?: string;
  autopost_voiceChannelLeave?: string;
  autoname_totalUserCount?: string;
  autoname_onlineUserCount?: string;
  autoname_activeUsersLast24h?: string;
  autoname_serverJoinsLast24h?: string;
  autoname_serverLeavesLast24h?: string;
  levelupMessage?: string;
  serverJoinMessage?: string;
  serverLeaveMessage?: string;
  voiceChannelJoinMessage?: string;
  voiceChannelLeaveMessage?: string;
  roleAssignMessage?: string;
  roleDeassignMessage?: string;
  lastCommandDate?: string;
  lastTokenBurnDate?: string;
  resetDay?: number;
  resetHour?: number;
  joinedAtDate?: string;
  leftAtDate?: string;
  addDate: Date;
  isBanned?: boolean;
}

export interface CachedGuild extends CachedGuildStore {
  addDate: number;
  dbHost: any; //TODO
}

async function buildCache(guild: Guild) {
  const dbHost = await getDbHost(guild.id);
  let cache = (await shardDb.query(
    dbHost,
    `SELECT ${cachedFields.join(',')} FROM guild WHERE guildId = ${guild.id}`,
  )) as CachedGuildStore[];

  if (cache.length == 0) {
    await shardDb.query(
      dbHost,
      `INSERT INTO guild (guildId,joinedAtDate,addDate) VALUES (${guild.id},${Math.floor(
        guild.members.me!.joinedAt!.getTime() / 1000,
      )},${Math.floor(Date.now() / 1000)})`,
    );
    cache = (await shardDb.query(
      dbHost,
      `SELECT ${cachedFields.join(',')} FROM guild WHERE guildId = ${guild.id}`,
    )) as CachedGuildStore[];
  }

  const cachedGuildStore = cache[0]!;
  const cachedGuild: CachedGuild = {
    ...cachedGuildStore,
    addDate: cachedGuildStore.addDate * 1,
    dbHost,
  };
  guild.appData = cachedGuild;
}

const getDbHost = (guildId) => {
  return new Promise(async function (resolve, reject) {
    try {
      let res = await managerDb.query(
        `SELECT ${hostField} AS host FROM guildRoute LEFT JOIN dbShard ON guildRoute.dbShardId = dbShard.id WHERE guildId = ${guildId}`,
      );

      if (res.length < 1) {
        await managerDb.query(`INSERT INTO guildRoute (guildId) VALUES (${guildId})`);
        res = await managerDb.query(
          `SELECT ${hostField} AS host FROM guildRoute LEFT JOIN dbShard ON guildRoute.dbShardId = dbShard.id WHERE guildId = ${guildId}`,
        );
      }

      resolve(res[0].host);
    } catch (e) {
      reject(e);
    }
  });
};

// GENERATED: start of generated content by `exports-to-default`.
// [GENERATED: exports-to-default:v0]

export default {
  cache,
  storage,
};

// GENERATED: end of generated content by `exports-to-default`.
