const fct = require('../../util/fct.js');
const shardDb = require('../../models/shardDb/shardDb.js');
const guildMemberModel = require('./guild/guildMemberModel.js');
const guildChannelModel = require('./guild/guildChannelModel.js');

let resetJobs = {};
exports.resetJobs = resetJobs;
exports.storage = {};
exports.cache = {};

// Storage

exports.storage.resetGuildAll = (batchsize,guild) => {
  return new Promise(async function (resolve, reject) {
    try {
      let affectedRows = 0;

      affectedRows += await exports.storage.resetGuildStats(batchsize-affectedRows,guild);
      if (affectedRows < batchsize)
        affectedRows += await exports.storage.resetGuildSettings(batchsize,guild);

      resolve(affectedRows);
    } catch (e) { reject(e); }
  });
}

const noResetGuildFields = ['guildId','tokens','tokensBurned','lastCommandDate','lastTokenBurnDate','joinedAtDate','leftAtDate','addDate'];
exports.storage.resetGuildSettings = (batchsize,guild) => {
  return new Promise(async function (resolve, reject) {
    try {
      let affectedRows = 0;

      affectedRows += (await shardDb.query(guild.appData.dbHost,`DELETE FROM guildRole WHERE guildId = ${guild.id} LIMIT ${batchsize}`)).affectedRows;
      if (affectedRows < batchsize)
        affectedRows += (await shardDb.query(guild.appData.dbHost,`DELETE FROM guildMember WHERE guildId = ${guild.id} LIMIT ${batchsize - affectedRows}`)).affectedRows;
      if (affectedRows < batchsize)
        affectedRows += (await shardDb.query(guild.appData.dbHost,`DELETE FROM guildChannel WHERE guildId = ${guild.id} LIMIT ${batchsize - affectedRows}`)).affectedRows;

      if (affectedRows < batchsize) {
        const keys = Object.keys((await shardDb.query(guild.appData.dbHost,`SELECT * FROM guild WHERE guildId = ${guild.id}`))[0]);
        const keySqls = [];
        for (let key of keys)
          if (noResetGuildFields.indexOf(key) == -1)
            keySqls.push(key + '=DEFAULT(' + key + ')');
        await shardDb.query(guild.appData.dbHost,`UPDATE guild SET ${keySqls.join(',')} WHERE guildId = ${guild.id}`);

        exports.cache.resetGuildRolesAll(guild);
        exports.cache.resetGuildChannelsAll(guild);
        exports.cache.resetGuildMembersAll(guild);
        exports.cache.resetGuild(guild);
      }

      //console.log(res);
      resolve(affectedRows);
    } catch (e) { reject(e); }
  });
}

exports.storage.resetGuildStats = (batchsize,guild) => {
  return new Promise(async function (resolve, reject) {
    try {
      let affectedRows = 0;

      affectedRows += (await shardDb.query(guild.appData.dbHost,`DELETE FROM textMessage WHERE guildId = ${guild.id} LIMIT ${batchsize}`)).affectedRows;
      if (affectedRows < batchsize)
        affectedRows += (await shardDb.query(guild.appData.dbHost,`DELETE FROM voiceMinute WHERE guildId = ${guild.id} LIMIT ${batchsize - affectedRows}`)).affectedRows;
      if (affectedRows < batchsize)
        affectedRows += (await shardDb.query(guild.appData.dbHost,`DELETE FROM vote WHERE guildId = ${guild.id} LIMIT ${batchsize - affectedRows}`)).affectedRows;
      if (affectedRows < batchsize)
        affectedRows += (await shardDb.query(guild.appData.dbHost,`DELETE FROM bonus WHERE guildId = ${guild.id} LIMIT ${batchsize - affectedRows}`)).affectedRows;

      if (affectedRows < batchsize)
        exports.cache.resetGuildMembersAll(guild);

      resolve(affectedRows);
    } catch (e) { reject(e); }
  });
}

exports.storage.resetGuildMembers = (batchsize,guild,userIds) => {
  return new Promise(async function (resolve, reject) {
    try {
      let affectedRows = 0;

      affectedRows += (await shardDb.query(guild.appData.dbHost,`DELETE FROM textMessage WHERE guildId = ${guild.id} AND userId IN (${userIds.join(',')}) LIMIT ${batchsize}`)).affectedRows;
      if (affectedRows < batchsize)
        affectedRows += (await shardDb.query(guild.appData.dbHost,`DELETE FROM voiceMinute WHERE guildId = ${guild.id} AND userId IN (${userIds.join(',')}) LIMIT ${batchsize - affectedRows}`)).affectedRows;
      if (affectedRows < batchsize)
        affectedRows += (await shardDb.query(guild.appData.dbHost,`DELETE FROM vote WHERE guildId = ${guild.id} AND userId IN (${userIds.join(',')}) LIMIT ${batchsize - affectedRows}`)).affectedRows;
      if (affectedRows < batchsize)
        affectedRows += (await shardDb.query(guild.appData.dbHost,`DELETE FROM bonus WHERE guildId = ${guild.id} AND userId IN (${userIds.join(',')}) LIMIT ${batchsize - affectedRows}`)).affectedRows;

      if (affectedRows < batchsize)
        exports.cache.resetGuildMemberIds(guild,userIds);

      resolve(affectedRows);
    } catch (e) { reject(e); }
  });
}

exports.storage.resetGuildChannels = (batchsize,guild,channelIds) => {
  return new Promise(async function (resolve, reject) {
    try {
      let affectedRows = 0;

      affectedRows += (await shardDb.query(guild.appData.dbHost,`DELETE FROM textMessage WHERE guildId = ${guild.id} AND channelId IN (${channelIds.join(',')}) LIMIT ${batchsize}`)).affectedRows;
      if (affectedRows < batchsize)
        affectedRows += (await shardDb.query(guild.appData.dbHost,`DELETE FROM voiceMinute WHERE guildId = ${guild.id} AND channelId IN (${channelIds.join(',')}) LIMIT ${batchsize - affectedRows}`)).affectedRows;

      if (affectedRows < batchsize) {
        exports.cache.resetGuildMembersAll(guild);
        exports.cache.resetGuildChannelIds(guild,channelIds);
      }


      resolve(affectedRows);
    } catch (e) { reject(e); }
  });
}

exports.storage.getDeletedUserIds = (guild) => {
  return new Promise(async function (resolve, reject) {
    try {
      const userIds = await guildMemberModel.getRankedUserIds(guild);
      const users = await guild.members.fetch({cache: false, withPresences: false});  // # discordapi

      let deletedUserIds = [],user;
      for (let userId of userIds) {
        user = users.get(userId);
        if (user)
          continue;

        deletedUserIds.push(userId);
      }

      resolve(deletedUserIds);
    } catch (e) { reject(e); }
  });
}

exports.storage.getDeletedChannelIds = (guild) => {
  return new Promise(async function (resolve, reject) {
    try {
      const channelIds = await guildChannelModel.getRankedChannelIds(guild);

      let deletedChannelIds = [],channel;
      for (let channelId of channelIds) {
        channel = guild.channels.cache.get(channelId);
        if (channel)
          continue;

        deletedChannelIds.push(channelId);
      }

      resolve(deletedChannelIds);
    } catch (e) { reject(e); }
  });
}


// Cache

exports.cache.resetGuild = (guild) => {
  if (guild.appData)
    delete guild.appData;

  return;
}

exports.cache.resetGuildMembersAll = (guild) => {
  for (let member of guild.members.cache) {
    if (member[1].appData)
      delete member[1].appData;
  }
  return;
}

exports.cache.resetGuildChannelsAll = (guild) => {
  for (let channel of guild.channels.cache) {
    if (channel[1].appData)
      delete channel[1].appData;
  }
  return;
}

exports.cache.resetGuildRolesAll = (guild) => {
  for (let role of guild.roles.cache) {
    if (role[1].appData)
      delete role[1].appData;
  }
  return;
}

exports.cache.resetGuildMemberIds = (guild,userIds) => {
  let member;
  for (let userId of userIds) {
    member = guild.members.cache.get(userId);
    if (member && member.appData)
      delete member.appData;
  }
  return;
}

exports.cache.resetGuildChannelIds = (guild,channelIds) => {
  let channel;
  for (let channelId of channelIds) {
    channel = guild.channels.cache.get(channelId);
    if (channel && channel.appData)
      delete channel.appData;
  }
  return;
}

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
