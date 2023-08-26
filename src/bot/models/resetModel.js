import shardDb from '../../models/shardDb/shardDb.js';
import guildMemberModel from './guild/guildMemberModel.js';
import guildChannelModel from './guild/guildChannelModel.js';

export const resetJobs = {};
export const storage = {};
export const cache = {};

// Storage

storage.resetGuildAll = async (batchsize, guild) => {
  let affectedRows = 0;

  affectedRows += await storage.resetGuildStats(
    batchsize - affectedRows,
    guild,
  );
  if (affectedRows < batchsize)
    affectedRows += await storage.resetGuildSettings(batchsize, guild);

  return affectedRows;
};

const noResetGuildFields = [
  'guildId',
  //'tokens',
  //'tokensBurned',
  'lastCommandDate',
  //'lastTokenBurnDate',
  'joinedAtDate',
  'leftAtDate',
  'addDate',
];

storage.resetGuildSettings = async (batchsize, guild) => {
  let affectedRows = 0;
  const tables = ['guildRole', 'guildMember', 'guildChannel'];

  for (const table of tables) {
    if (affectedRows < batchsize) {
      affectedRows += (
        await shardDb.query(
          guild.appData.dbHost,
          `DELETE FROM ${table} WHERE guildId = ${guild.id} LIMIT ${
            batchsize - affectedRows
          }`,
        )
      ).affectedRows;
    }
  }

  if (affectedRows < batchsize) {
    const keys = Object.keys(
      (
        await shardDb.query(
          guild.appData.dbHost,
          `SELECT * FROM guild WHERE guildId = ${guild.id}`,
        )
      )[0],
    );
    const keySqls = [];
    for (const key of keys) {
      if (noResetGuildFields.indexOf(key) == -1)
        keySqls.push(key + '=DEFAULT(' + key + ')');
    }
    await shardDb.query(
      guild.appData.dbHost,
      `UPDATE guild SET ${keySqls.join(',')} WHERE guildId = ${guild.id}`,
    );

    cache.resetGuildRolesAll(guild);
    cache.resetGuildChannelsAll(guild);
    cache.resetGuildMembersAll(guild);
    cache.resetGuild(guild);
  }

  return affectedRows;
};

storage.resetGuildStats = async (batchsize, guild) => {
  let affectedRows = 0;
  const tables = ['textMessage', 'voiceMinute', 'vote', 'invite', 'bonus'];

  for (const table of tables) {
    if (affectedRows < batchsize) {
      affectedRows += (
        await shardDb.query(
          guild.appData.dbHost,
          `DELETE FROM ${table} WHERE guildId = ${guild.id} LIMIT ${
            batchsize - affectedRows
          }`,
        )
      ).affectedRows;
    }
  }

  if (affectedRows < batchsize) {
    affectedRows += (
      await shardDb.query(
        guild.appData.dbHost,
        `UPDATE guildMember SET inviter=DEFAULT(inviter) WHERE guildId = ${
          guild.id
        } LIMIT ${batchsize - affectedRows}`,
      )
    ).affectedRows;
  }

  if (affectedRows < batchsize) cache.resetGuildMembersAll(guild);

  return affectedRows;
};

storage.resetGuildStatsByType = async (batchsize, guild, type) => {
  let affectedRows = 0;

  affectedRows += (
    await shardDb.query(
      guild.appData.dbHost,
      `DELETE FROM ${type} WHERE guildId = ${guild.id} LIMIT ${batchsize}`,
    )
  ).affectedRows;

  if (type == 'invite' && affectedRows < batchsize) {
    affectedRows += (
      await shardDb.query(
        guild.appData.dbHost,
        `UPDATE guildMember SET inviter=DEFAULT(inviter) WHERE guildId = ${
          guild.id
        } LIMIT ${batchsize - affectedRows}`,
      )
    ).affectedRows;
  }

  if (affectedRows < batchsize) cache.resetGuildMembersAll(guild);

  return affectedRows;
};

storage.resetGuildMembersStats = async (batchsize, guild, userIds) => {
  let affectedRows = 0;

  const tables = ['textMessage', 'voiceMinute', 'vote', 'invite', 'bonus'];

  for (const table of tables) {
    if (affectedRows < batchsize) {
      affectedRows += (
        await shardDb.query(
          guild.appData.dbHost,
          `DELETE FROM ${table} WHERE guildId = ${
            guild.id
          } AND userId in (${userIds.join(',')}) LIMIT ${
            batchsize - affectedRows
          }`,
        )
      ).affectedRows;
    }
  }

  if (affectedRows < batchsize) {
    affectedRows += (
      await shardDb.query(
        guild.appData.dbHost,
        `UPDATE guildMember SET inviter=DEFAULT(inviter) WHERE guildId = ${
          guild.id
        } AND userId IN (${userIds.join(',')}) LIMIT ${
          batchsize - affectedRows
        }`,
      )
    ).affectedRows;
  }

  if (affectedRows < batchsize) cache.resetGuildMemberIds(guild, userIds);

  return affectedRows;
};

storage.resetGuildChannelsStats = async (batchsize, guild, channelIds) => {
  let affectedRows = 0;

  const tables = ['textMessage', 'voiceMinute'];

  for (const table of tables) {
    if (affectedRows < batchsize) {
      affectedRows += (
        await shardDb.query(
          guild.appData.dbHost,
          `DELETE FROM ${table} WHERE guildId = ${
            guild.id
          } AND channelId IN (${channelIds.join(',')}) LIMIT ${
            batchsize - affectedRows
          }`,
        )
      ).affectedRows;
    }
  }

  if (affectedRows < batchsize) {
    cache.resetGuildMembersAll(guild);
    cache.resetGuildChannelIds(guild, channelIds);
  }

  return affectedRows;
};

storage.getDeletedUserIds = async (guild) => {
  const userIds = await guildMemberModel.getRankedUserIds(guild);
  const users = await guild.members.fetch({
    cache: false,
    withPresences: false,
  }); // # discordapi

  const deletedUserIds = [];

  for (const userId of userIds) {
    if (users.get(userId)) continue;

    deletedUserIds.push(userId);
  }

  return deletedUserIds;
};

storage.getDeletedChannelIds = async (guild) => {
  const channelIds = await guildChannelModel.getRankedChannelIds(guild);

  const deletedChannelIds = [];
  for (const channelId of channelIds) {
    if (guild.channels.cache.get(channelId)) continue;

    deletedChannelIds.push(channelId);
  }

  return deletedChannelIds;
};

// Cache

cache.resetGuild = (guild) => {
  if (guild.appData) delete guild.appData;

  return;
};

cache.resetGuildMembersAll = (guild) => {
  for (const member of guild.members.cache)
    if (member[1].appData) delete member[1].appData;

  return;
};

cache.resetGuildChannelsAll = (guild) => {
  for (const channel of guild.channels.cache)
    if (channel[1].appData) delete channel[1].appData;

  return;
};

cache.resetGuildRolesAll = (guild) => {
  for (const role of guild.roles.cache)
    if (role[1].appData) delete role[1].appData;

  return;
};

cache.resetGuildMemberIds = (guild, userIds) => {
  let member;
  for (const userId of userIds) {
    member = guild.members.cache.get(userId);
    if (member && member.appData) delete member.appData;
  }
  return;
};

cache.resetGuildChannelIds = (guild, channelIds) => {
  let channel;
  for (const channelId of channelIds) {
    channel = guild.channels.cache.get(channelId);
    if (channel && channel.appData) delete channel.appData;
  }
  return;
};

/*
function getSchema(tablename) {
  return new Promise(function (resolve, reject) {
    db.query(`SHOW COLUMNS FROM ${tablename}`, function (err, results, fields) {
      if (err) return reject(err);
      resolve(results);
    });
  });
}
*/
