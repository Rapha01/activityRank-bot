import shardDb from '../../../models/shardDb/shardDb.js';
import managerDb from '../../../models/managerDb/managerDb.js';
import mysql from 'promise-mysql';
import type { Guild } from 'discord.js';
import type { guild } from 'models/types/shard.js';

const promises: Record<string, Promise<void>> = {};

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
] as const;

export const cache = {
  load: (guild: Guild) => {
    if (!guild.appData) {
      if (guild.id in promises) return promises[guild.id];

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
  },
};

export const storage = {
  set: async (guild: Guild, field: string, value) => {
    await shardDb.query(
      guild.appData.dbHost,
      `UPDATE guild SET ${field} = ${mysql.escape(value)} WHERE guildId = ${guild.id}`,
    );

    if (cachedFields.indexOf(field) > -1) guild.appData[field] = value;
  },
  increment: async (guild: Guild, field: string, value) => {
    await shardDb.query(
      guild.appData.dbHost,
      `UPDATE guild SET ${field} = ${field} + ${mysql.escape(value)} WHERE guildId = ${guild.id}`,
    );

    if (cachedFields.indexOf(field) > -1) guild.appData[field] += value * 1;
  },

  get: async (guild: Guild) => {
    const res = await shardDb.query<guild[]>(
      guild.appData.dbHost,
      `SELECT * FROM guild WHERE guildId = ${guild.id}`,
    );
    if (res.length == 0) return null;
    else return res[0];
  },
};

export type CachedGuild = Pick<guild, (typeof cachedFields)[number]> & {
  dbHost: string;
  lastAskForPremiumDate: number;
};

async function buildCache(guild: Guild) {
  const dbHost = await getDbHost(guild.id);
  let cache = await shardDb.query<CachedGuild[]>(
    dbHost,
    `SELECT ${cachedFields.join(',')} FROM guild WHERE guildId = ${guild.id}`,
  );

  if (cache.length == 0) {
    await shardDb.query(
      dbHost,
      `INSERT INTO guild (guildId,joinedAtDate,addDate) VALUES (${guild.id},${Math.floor(
        guild.members.me!.joinedAt!.getTime() / 1000,
      )},${Math.floor(Date.now() / 1000)})`,
    );
    cache = await shardDb.query<CachedGuild[]>(
      dbHost,
      `SELECT ${cachedFields.join(',')} FROM guild WHERE guildId = ${guild.id}`,
    );
  }

  const cachedGuild = cache[0]!;
  cachedGuild.dbHost = dbHost;
  guild.appData = cachedGuild;
}

const getDbHost = async (guildId: string): Promise<string> => {
  let res = await managerDb.query(
    `SELECT ${hostField} AS host FROM guildRoute LEFT JOIN dbShard ON guildRoute.dbShardId = dbShard.id WHERE guildId = ${guildId}`,
  );

  if (res.length < 1) {
    await managerDb.query(`INSERT INTO guildRoute (guildId) VALUES (${guildId})`);
    res = await managerDb.query(
      `SELECT ${hostField} AS host FROM guildRoute LEFT JOIN dbShard ON guildRoute.dbShardId = dbShard.id WHERE guildId = ${guildId}`,
    );
  }

  return res[0].host;
};

export default {
  cache,
  storage,
};
