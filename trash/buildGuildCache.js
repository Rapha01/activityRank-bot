const managerDb = require('../../models/managerDb/managerDb.js');
const guildDb = require('../../models/guildDb/guildDb.js');
const batchsize = 100;

module.exports = (guildId) => {
  return new Promise(async function (resolve, reject) {
    console.log('BuildGuildCache');
    let dbHost;
    try {
      dbHost = await getGuildHost(guildId);
    } catch (e) { return reject(e); }

    console.log(dbHost);
    let conn;
    try {
      conn = await guildDb.getConnection(dbHost);
    } catch (e) { return reject(e); }

    try {
      const guild = await buildGuildCache(guildId,dbHost,conn);

      await conn.end();

      resolve(guild);
    } catch (e) { conn.end(); reject(e); }
  });
}

const buildGuildCache = (guildId,dbHost,conn) => {
  return new Promise(async function (resolve, reject) {
    try {
      // Guild
      let cached_guild = await guildModel.storage.getCreate(guildId);

      // GuildRoles
      let cached_role; cached_guild.roles = new Map();
      const stored_roles = await conn.query(`SELECT roleId,assignLevel,deassignLevel,assignMessage,deassignMessage,noXP FROM guildRole WHERE guildId = ${guildId}`);
      for (stored_role of stored_roles) {
        cached_role = getCreateRole(cached_guild,stored_role.roleId);
        cached_role.assignLevel = stored_role.assignLevel;
        cached_role.deassignLevel = stored_role.deassignLevel;
        cached_role.assignMessage = stored_role.assignMessage;
        cached_role.deassignMessage = stored_role.deassignMessage;
        cached_role.noXP = stored_role.noXP;
      }

      // GuildChannels
      let cached_channel; cached_guild.channels = new Map();
      const stored_channels = await conn.query(`SELECT channelId,noXP FROM guildChannel WHERE guildId = ${guildId}`);
      for (stored_channel of stored_channels) {
        cached_channel = getCreateChannel(cached_guild,stored_channel.channelId);
        cached_channel.noXP = stored_channel.noXP;
      }

      // GuildMembers
      let cached_member; cached_guild.members = new Map();
      const stored_members = await conn.query(`SELECT userId,notifyLevelupDm FROM guildMember WHERE guildId = ${guildId}`);
      for (stored_member of stored_members) {
        cached_member = getCreateMember(cached_guild,stored_member.userId);
        cached_member.notifyLevelupDm = stored_member.notifyLevelupDm;
      }

      // Stats
      const textMessages = await conn.query(`SELECT userId,SUM(alltime) AS textMessageAlltime
            FROM textMessage WHERE guildId = ${guildId} AND alltime != 0 GROUP BY userId`);
      const voiceMinutes = await conn.query(`SELECT userId,SUM(alltime) AS voiceMinuteAlltime
            FROM voiceMinute WHERE guildId = ${guildId} AND alltime != 0 GROUP BY userId`);
      const votes = await conn.query(`SELECT userId,alltime AS voteAlltime
            FROM vote WHERE guildId = ${guildId} AND alltime != 0`);
      const bonuses = await conn.query(`SELECT userId,alltime AS bonusAlltime
            FROM bonus WHERE guildId = ${guildId} AND alltime != 0`);

      addStats(cached_guild,textMessages,voiceMinutes,votes,bonuses);
      console.log(cached_guild);
      resolve();
    } catch (e) { reject(e); }
  });
}

const addStats = (cached_guild,textMessages,voiceMinutes,votes,bonuses) => {
  let member;

  for (text of textMessages) {
    member = getCreateMember(cached_guild,text.userId);
    member.totalScore += text.textMessageAlltime * cached_guild.pointsPerTextMessage;
  }
  for (voice of voiceMinutes) {
    member = getCreateMember(cached_guild,voice.userId);
    member.totalScore += voice.voiceMinuteAlltime * cached_guild.pointsPerVoiceMinute;
  }
  for (vote of votes) {
    member = getCreateMember(cached_guild,vote.userId);
    member.totalScore += vote.voteAlltime * cached_guild.pointsPerVote;
  }
  for (bonus of bonuses) {
    member = getCreateMember(cached_guild,bonus.userId);
    member.totalScore += bonus.bonusAlltime * cached_guild.pointsPerBonus;
  }
};

const getCreateMember = (cached_guild,userId) => {
  const member = cached_guild.members.get(userId);

  if (!member)
    cached_guild.members.set(userId,{
      userId: userId,
      notifyLevelupDm: 1,
      totalScore: 0
    });

  return cached_guild.members.get(userId);
};

const getCreateRole = (cached_guild,roleId) => {
  const role = cached_guild.roles.get(roleId);

  if (!role)
    cached_guild.roles.set(roleId,{
      roleId: roleId,
      assignLevel: 0,
      deassignLevel: 0,
      assignMessage: '',
      deassignMessage: '',
      noXP: 0
    });

  return cached_guild.roles.get(roleId);
};

const getCreateChannel = (cached_guild,channelId) => {
  const channel = cached_guild.channels.get(channelId);

  if (!channel)
    cached_guild.channels.set(channelId,{
      channelId: channelId,
      noXP: 0,
    });

  return cached_guild.channels.get(channelId);
};

const getGuildHost = (guildId) => {
  return new Promise(async function (resolve, reject) {
    let conn;

    try {
      conn = await managerDb.getConnection();
    } catch (e) { return reject(e); }

    try {
      let res = await conn.query(`SELECT guildid, host FROM server_guild LEFT JOIN server_guildDb ON server_guild.guilddbid = server_guildDb.id WHERE guildid = ${guildId}`);

      if (res.length < 1) {
         await conn.query(`INSERT INTO server_guild (guildid) VALUES (${guildId})`);
         res = await conn.query(`SELECT guildid, host FROM server_guild LEFT JOIN server_guildDb ON server_guild.guilddbid = server_guildDb.id WHERE guildid = ${guildId}`);
      }

      await conn.end();

      resolve(res[0].host);
    } catch (e) { conn.end(); reject(e); }
  });
}
