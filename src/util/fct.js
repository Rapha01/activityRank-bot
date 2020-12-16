const mysql = require('mysql');
const Discord = require('discord.js');
const guildRoleModel = require('../bot/models/guild/guildRoleModel.js');

module.exports.maxBigInt = 9223372036854775807;
module.exports.minIdInt = 1000000000000;

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


exports.dateDifferenceSec = (date1,date2) => {
  const date1Timestamp = new Date(date1.getTime() - date1.getTimezoneOffset() * 60000).getTime() / 1000;
  const date2Timestamp = new Date(date2.getTime() - date2.getTimezoneOffset() * 60000).getTime() / 1000;

  return date1Timestamp - date2Timestamp;
}

exports.dateTimeString = (date) => {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

exports.isPremiumGuild = (guild) => {
  if (guild.appData.addDate + 86400 * 7 > Date.now() / 1000)
    return true;

  if (guild.appData.tokens >= exports.getTokensToBurn24h(guild.memberCount))
    return true;
  else
    return false;
}

exports.hasNoXpRole = (member) => {
  return new Promise(async function (resolve, reject) {
    try {
      for (let role of member.roles.cache) {
        role = role[1];
        await guildRoleModel.cache.load(role);

        if (role.appData.noXp) {
          return resolve(true);
        }
      }
      resolve(false);
    } catch (e) { reject(e); }
  });
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

exports.getLevel = (levelProgression) => {
  return Math.floor(levelProgression);
}

exports.getLevelProgression = (totalScore,levelFactor) => {
  return solve(levelFactor/2,levelFactor/2 + 100,-totalScore) + 1;
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

/*
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
*/
