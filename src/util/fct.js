const mysql = require('mysql');
const Discord = require('discord.js');

module.exports.maxBigInt = 9223372036854775807;
module.exports.minIdInt = 1000000000000;

// Nameing

exports.getChannelName = (channels,channelId) => {
  const channel = channels.get(channelId);

  if (channel)
    return exports.cutName(channel.name);
  else
    return 'Deleted [' + channelId + ']';
}

exports.getChannelType = (channels,channelId) => {
  const channel = channels.get(channelId);

  if (channel)
    return channel.type;
  else
    return null;
}

exports.getRoleName = (roles,roleId) => {
  const role = roles.get(roleId);

  if (role)
    return exports.cutName(role.name);
  else
    return 'Deleted [' + roleId + ']\n';
}

exports.getChannelTypeIcon = (channels,channelId) => {
  const channel = channels.get(channelId);

  if (!channel)
    return ':grey_question:';

  if (channel.type == 'voice')
    return ':microphone2:';
  else
    return ':writing_hand:';
}

// Db
exports.conditionsToSQL = (conditions) => {
  const properties = Object.keys(conditions);
  let conditionStrings = [];

  for (property of properties)
    conditionStrings.push(property + '=' + mysql.escape(conditions[property]));

  if (conditionStrings.length == 0)
    return '1';
  else
    return conditionStrings.join(' AND ');
}

// System
exports.waitAndReboot = async (milliseconds) => {
  try {
    console.log('Restarting in ' + milliseconds/1000 + 's');
    await exports.sleep(milliseconds);
    console.log('Restart');
    process.exit();

  } catch (err) { console.log(err); }
}

exports.sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

exports.isDateInThePast = (compareDate, nowDate) => {
  if (compareDate.getTime() < nowDate.getTime())
    return true;
  else
    return false;
}

exports.getLevel = (levelProgression) => {
  return Math.floor(levelProgression);
}

exports.getLevelProgression = (totalScore,levelFactor) => {
  return solve(levelFactor/2,levelFactor/2 + 100,-totalScore) + 1;
}

exports.planTagToName = (tag) => {
  if (tag == 'supporter1')
    return 'Supporter Level I';
  if (tag == 'supporter2')
    return 'Supporter Level II';
  if (tag == 'supporter3')
    return 'Supporter Level III';

  return '';
}

exports.dateDifferenceSec = (date1,date2) => {
  const date1Timestamp = new Date(date1.getTime() - date1.getTimezoneOffset() * 60000).getTime() / 1000;
  const date2Timestamp = new Date(date2.getTime() - date2.getTimezoneOffset() * 60000).getTime() / 1000;

  return date1Timestamp - date2Timestamp;
}

exports.dateTimeString = (date) => {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

function solve(a, b, c) {
    var result = (-1 * b + Math.sqrt(Math.pow(b, 2) - (4 * a * c))) / (2 * a);
    var result2 = (-1 * b - Math.sqrt(Math.pow(b, 2) - (4 * a * c))) / (2 * a);

    if (result >= 0)
      return result;
    if (result2 >= 0)
      return result2;
    else
      return null;
}

exports.getGuildActionCooldown = (guild,field,cd) => {
    const nowDate = new Date() / 1000;
    const cache = guild.appData;

    if (typeof cache[field] === 'undefined') cache[field] = 0;

    const remaining = cd - (nowDate - cache[field]);
    return(remaining);
}

exports.getMemberActionCooldown = (member,field,cd) => {
    const nowDate = new Date() / 1000;
    const cache = member.appData;

    if (typeof cache[field] === 'undefined') cache[field] = 0;

    const remaining = cd - (nowDate - cache[field]);

    //if (member.id == '370650814223482880')
      //return 0;

    return(remaining);
}

exports.isPremiumGuild = (guild) => {
  if (guild.appData.addDate + 86400 * 7 > Date.now() / 1000)
    return true;

  if (guild.appData.tokens >= exports.getTokensToBurn24h(guild.memberCount))
    return true;
  else
    return false;
}

exports.getTokensToBurn24h = (memberCount) => {
  return Math.pow(memberCount, 1/1.5);
}

exports.extractPage = (args,entriesPerPage) => {
    let page = 1;
    let time = 'Alltime';

    for (i = 0;i < args.length;i++) {
      if ((+args[i]))
        page = Math.min(args.splice(i, 1), 100);
      if (args[i] == 'year' || args[i] == 'month' || args[i] == 'week' || args[i] == 'day')
        time = exports.capitalizeFirstLetter(args[i]);
    }

    const from = Math.max((page-1) * entriesPerPage + 1);
    const to = page * entriesPerPage;

    return {page:page,from:from,to:to};
}

exports.extractTime = (args) => {
    let time = 'Alltime';

    for (i = 0;i < args.length;i++) {
      if (args[i] == 'year' || args[i] == 'month' || args[i] == 'week' || args[i] == 'day')
        time = exports.capitalizeFirstLetter(args[i]);
    }

    return time;
}

exports.capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

exports.getGuildMemberNames = (guild,userIds) => {
  return new Promise(async function (resolve, reject) {
    try {
      let userId,member,userIdsToFetch = [],userNames = {};

      // Add cached
      for (userId of userIds) {
        member = guild.members.cache.get(userId);
        if (member)
          userNames[userId] = exports.getGuildMemberAlias(member);
        else
          userIdsToFetch.push(userId);
      }

      // Add fetched
      if (userIdsToFetch.length > 0) {
        const fetchedMembers = await guild.members.fetch({user: userIdsToFetch, withPresences:false, cache: false});// #discordapi
        for (let fetchedMember of fetchedMembers)
          userNames[userId] = exports.getGuildMemberAlias(fetchedMember[1]);
      }

      // Add deleted
      for (userId of userIds) {
        if (!userNames[userId])
          userNames[userId] = 'User left [' + userId + ']';
      }

      resolve(userNames);
    } catch (e) { console.log(e); }
  });
}

exports.getGuildMemberName = (guild,userId) => {
  return new Promise(async function (resolve, reject) {
    try {
      const guildMemberName = (await exports.getGuildMemberNames(guild,[userId]))[userId];
      resolve(guildMemberName);
    } catch (e) { console.log(e); }
  });
}

exports.addGuildMemberNamesToRanks = (guild,memberRanks) => {
  return new Promise(async function (resolve, reject) {
    try {
      let userIds = [],memberRank;
      for (memberRank of memberRanks) userIds.push(memberRank.userId);
      const userNames = await exports.getGuildMemberNames(guild,userIds);

      for (memberRank of memberRanks)
        memberRank.name = userNames[memberRank.userId];

      resolve();
    } catch (e) { console.log(e); }
  });
}

exports.getGuildMemberAlias = (member) => {
  if (member.guild.appData.showNicknames) {
    if (member.nickname)
      return exports.cutName(member.nickname);
    else
      return exports.cutName(member.user.username);
  } else
    return exports.cutName(member.user.username);
}

exports.cutName = (name) => {
  if (name.length > 32)
    name = name.substr(0,32) + '..';

  return name;
}

exports.getSimpleEmbed = (title,text) => {
  const embed = new Discord.MessageEmbed();
  embed.setColor(0x00AE86);

  if (title != '')
    embed.setAuthor(title);

  if (text != '')
    embed.setDescription(text);

  return embed;

}
