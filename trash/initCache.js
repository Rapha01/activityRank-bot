const managerDb = require('./managerDb.js');
const guildDb = require('./guildDb.js');
const guildMemberModel = require('./guildMemberModel.js');
const batchsize = 100;

exports.initCache = (bot) => {
  return new Promise(async function (resolve, reject) {
    try {
      server_guilds = await managerDb.query(`SELECT guildId,host  FROM server_guild LEFT JOIN server_guildDb ON server_guild.guilddbid = server_guildDb.id WHERE server_guild.guildId IN (${Array.from(bot.guilds.cache.keys()).join(',')})`);
      server_guilds = groupBy(server_guilds,'host');

      for (host in server_guilds)
        while (server_guilds[host].length > 0)
          await loadCache(bot,host,server_guilds[host].splice(0,batchsize));

      resolve();
    } catch (e) { reject(e); }
  });
}

const loadCache = (bot,host,server_guilds) => {
  return new Promise(async function (resolve, reject) {
    try {
      const conn = await guildDb.getConnection(host);

      let guildIds = []; for (server_guild of server_guilds) guildIds.push(server_guild.guildId);
      const myGuilds = await conn.query(`SELECT guildId,prefix,pointsPerTextMessage,pointsPerVoiceMinute,pointsPerVote,pointsPerBonus FROM guild WHERE guildId IN (${guildIds})`);
      const myGuildMembers = groupBy(await conn.query(`SELECT guildId,userId,notifylevelupdm FROM guildMember WHERE guildId IN (${guildIds})`), 'guildId');
      const myGuildRoles = groupBy(await conn.query(`SELECT guildId,roleId,noxp FROM guildRole WHERE guildId IN (${guildIds})`), 'guildId');
      const myGuildChannels = groupBy(await conn.query(`SELECT guildId,channelId,noxp FROM guildChannel WHERE guildId IN (${guildIds})`), 'guildId');

      const myGuildMemberTextmessages = groupBy(await conn.query(textmessagesSql(guildIds)), 'guildId');
      const myGuildMemberVoiceminutes = groupBy(await conn.query(voiceminutesSql(guildIds)), 'guildId');
      const myGuildMemberVote = groupBy(await conn.query(votesSql(guildIds)), 'guildId');
      const myGuildMemberBonus = groupBy(await conn.query(bonusSql(guildIds)), 'guildId');

      let guild,text,voice,vote,bonus;
      for (myGuild of myGuilds) {
        guild = bot.guilds.cache.get(myGuild.guildId);
        addStats(guild,myGuild,
            myGuildMemberTextmessages[myGuild.guildId],
            myGuildMemberVoiceminutes[myGuild.guildId],
            myGuildMemberVote[myGuild.guildId],
            myGuildMemberBonus[myGuild.guildId]);


        //console.log(guild);
      }

      await conn.end();
      resolve();
    } catch (e) { reject(e); }
  });
}

const addStats = function(guild,myGuild,textmessages, voiceminutes, votes, bonuses) {
  let member,memberCache;
  console.log(myGuild);
  for (textmessage of textmessages) {
    member = guild.members.cache.get(textmessage.userId);
    memberCache = guildMemberModel.cache.get(member);
    memberCache.totalScore += textmessage.textMessageAlltime * myGuild.pointsPerTextMessage;
    console.log(memberCache);
  }
  for (voiceminute of voiceminutes) {
    member = guild.members.cache.get(voiceminute.userId);
    memberCache = guildMemberModel.cache.get(member);
    memberCache.totalScore += voiceminute.voiceMinuteAlltime * myGuild.pointsPerVoiceMinute;
    console.log(memberCache);
  }
  for (vote of votes) {
    member = guild.members.cache.get(vote.userId);
    memberCache = guildMemberModel.cache.get(member);
    memberCache.totalScore += vote.voteAlltime * myGuild.pointsPerTextMessage;
    console.log(memberCache);
  }
  for (bonus of bonuses) {
    member = guild.members.cache.get(bonus.userId);
    memberCache = guildMemberModel.cache.get(member);
    memberCache.totalScore += bonus.bonusAlltime * myGuild.pointsPerTextMessage;
    console.log(memberCache);
  }
};

const addRoleAssignments = function(guild,myGuildRoles) {

};

const groupBy = function(xs, key) {
  return xs.reduce(function(rv, x) {
    (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, {});
};

const textmessagesSql = (guildIds) => `SELECT guildId,userId,
      SUM(alltime) AS textMessageAlltime
      FROM textMessage WHERE guildId IN (${guildIds.join(',')}) AND alltime != 0
      GROUP BY guildId,userId`;
const voiceminutesSql = (guildIds) => `SELECT guildId,userId,
      SUM(alltime) AS voiceMinuteAlltime FROM voiceMinute
      WHERE guildId IN (${guildIds.join(',')}) AND alltime != 0
      GROUP BY guildId,userId`;
const votesSql = (guildIds) => `SELECT guildId,userId,alltime AS voteAlltime
      FROM vote WHERE guildId IN (${guildIds.join(',')}) AND alltime != 0`;
const bonusSql = (guildIds) => `SELECT guildId,userId,alltime AS bonusAlltime
      FROM bonus WHERE guildId IN (${guildIds.join(',')}) AND alltime != 0`;
