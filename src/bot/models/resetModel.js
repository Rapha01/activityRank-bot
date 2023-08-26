import shardDb from '../../models/shardDb/shardDb.js';
import guildMemberModel from './guild/guildMemberModel.js';
import guildChannelModel from './guild/guildChannelModel.js';

const resetJobs = {};
exports.resetJobs = resetJobs;
exports.storage = {};
exports.cache = {};

// Storage

exports.storage.resetGuildAll = async (batchsize, guild) => {
  let affectedRows = 0;

  affectedRows += await exports.storage.resetGuildStats(
    batchsize - affectedRows,
    guild
  );
  if (affectedRows < batchsize)
    affectedRows += await exports.storage.resetGuildSettings(batchsize, guild);

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

exports.storage.resetGuildSettings = async (batchsize, guild) => {
  let affectedRows = 0;
  const tables = ['guildRole', 'guildMember', 'guildChannel'];

  for (const table of tables) {
    if (affectedRows < batchsize) {
      affectedRows += (
        await shardDb.query(
          guild.appData.dbHost,
          `DELETE FROM ${table} WHERE guildId = ${guild.id} LIMIT ${
            batchsize - affectedRows
          }`
        )
      ).affectedRows;
    }
  }

  if (affectedRows < batchsize) {
    const keys = Object.keys(
      (
        await shardDb.query(
          guild.appData.dbHost,
          `SELECT * FROM guild WHERE guildId = ${guild.id}`
        )
      )[0]
    );
    const keySqls = [];
    for (const key of keys) {
      if (noResetGuildFields.indexOf(key) == -1)
        keySqls.push(key + '=DEFAULT(' + key + ')');
    }
    await shardDb.query(
      guild.appData.dbHost,
      `UPDATE guild SET ${keySqls.join(',')} WHERE guildId = ${guild.id}`
    );

    exports.cache.resetGuildRolesAll(guild);
    exports.cache.resetGuildChannelsAll(guild);
    exports.cache.resetGuildMembersAll(guild);
    exports.cache.resetGuild(guild);
  }

  return affectedRows;
};

exports.storage.resetGuildStats = async (batchsize, guild) => {
  let affectedRows = 0;
  const tables = ['textMessage', 'voiceMinute', 'vote', 'invite', 'bonus'];

  for (const table of tables) {
    if (affectedRows < batchsize) {
      affectedRows += (
        await shardDb.query(
          guild.appData.dbHost,
          `DELETE FROM ${table} WHERE guildId = ${guild.id} LIMIT ${
            batchsize - affectedRows
          }`
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
        } LIMIT ${batchsize - affectedRows}`
      )
    ).affectedRows;
  }

  if (affectedRows < batchsize) exports.cache.resetGuildMembersAll(guild);

  return affectedRows;
};

exports.storage.resetGuildStatsByType = async (batchsize, guild, type) => {
  let affectedRows = 0;

  affectedRows += (
    await shardDb.query(
      guild.appData.dbHost,
      `DELETE FROM ${type} WHERE guildId = ${guild.id} LIMIT ${batchsize}`
    )
  ).affectedRows;

  if (type == 'invite' && affectedRows < batchsize) {
    affectedRows += (
      await shardDb.query(
        guild.appData.dbHost,
        `UPDATE guildMember SET inviter=DEFAULT(inviter) WHERE guildId = ${
          guild.id
        } LIMIT ${batchsize - affectedRows}`
      )
    ).affectedRows;
  }

  if (affectedRows < batchsize) exports.cache.resetGuildMembersAll(guild);

  return affectedRows;
};

exports.storage.resetGuildMembersStats = async (batchsize, guild, userIds) => {
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
          }`
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
        }`
      )
    ).affectedRows;
  }

  if (affectedRows < batchsize)
    exports.cache.resetGuildMemberIds(guild, userIds);

  return affectedRows;
};

exports.storage.resetGuildChannelsStats = async (
  batchsize,
  guild,
  channelIds
) => {
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
          }`
        )
      ).affectedRows;
    }
  }

  if (affectedRows < batchsize) {
    exports.cache.resetGuildMembersAll(guild);
    exports.cache.resetGuildChannelIds(guild, channelIds);
  }

  return affectedRows;
};

exports.storage.getDeletedUserIds = async (guild) => {
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

exports.storage.getDeletedChannelIds = async (guild) => {
  const channelIds = await guildChannelModel.getRankedChannelIds(guild);

  const deletedChannelIds = [];
  for (const channelId of channelIds) {
    if (guild.channels.cache.get(channelId)) continue;

    deletedChannelIds.push(channelId);
  }

  return deletedChannelIds;
};

// Cache

exports.cache.resetGuild = (guild) => {
  if (guild.appData) delete guild.appData;

  return;
};

exports.cache.resetGuildMembersAll = (guild) => {
  for (const member of guild.members.cache)
    if (member[1].appData) delete member[1].appData;

  return;
};

exports.cache.resetGuildChannelsAll = (guild) => {
  for (const channel of guild.channels.cache)
    if (channel[1].appData) delete channel[1].appData;

  return;
};

exports.cache.resetGuildRolesAll = (guild) => {
  for (const role of guild.roles.cache)
    if (role[1].appData) delete role[1].appData;

  return;
};

exports.cache.resetGuildMemberIds = (guild, userIds) => {
  let member;
  for (const userId of userIds) {
    member = guild.members.cache.get(userId);
    if (member && member.appData) delete member.appData;
  }
  return;
};

exports.cache.resetGuildChannelIds = (guild, channelIds) => {
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
