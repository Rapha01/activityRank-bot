import mysql from 'mysql';
import guildRoleModel from '../bot/models/guild/guildRoleModel.js';
import userModel from '../bot/models/userModel.js';

export const maxBigInt = 9223372036854775807;
export const minIdInt = 1000000000000;

// Db
export const conditionsToSQL = (conditions) => {
  const properties = Object.keys(conditions);
  const conditionStrings = [];

  for (const property of properties)
    conditionStrings.push(property + '=' + mysql.escape(conditions[property]));

  if (conditionStrings.length == 0) return '1';
  else return conditionStrings.join(' AND ');
};

// System
export const waitAndReboot = async (milliseconds) => {
  try {
    console.log('Restarting in ' + milliseconds / 1000 + 's');
    await sleep(milliseconds);
    console.log('Restart');
    process.exit();
  } catch (err) {
    console.log(err);
  }
};

export const sleep = (milliseconds) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

export const isDateInThePast = (compareDate, nowDate) => {
  if (compareDate.getTime() < nowDate.getTime()) return true;
  else return false;
};

export const dateDifferenceSec = (date1, date2) => {
  const date1Timestamp =
    new Date(date1.getTime() - date1.getTimezoneOffset() * 60000).getTime() / 1000;
  const date2Timestamp =
    new Date(date2.getTime() - date2.getTimezoneOffset() * 60000).getTime() / 1000;

  return date1Timestamp - date2Timestamp;
};

export const dateTimeString = (date) => {
  return date.toISOString().slice(0, 19).replace('T', ' ');
};

/*
exports.isPremiumGuild = (guild) => {
  if (guild.appData.addDate + 86400 * 7 > Date.now() / 1000) return true;

  if (guild.appData.tokens >= exports.getTokensToBurn24h(guild.memberCount))
    return true;
  else return false;
};*/

export const hasNoXpRole = async (member) => {
  for (const role of member.roles.cache.values()) {
    await guildRoleModel.cache.load(role);
    if (role.appData.noXp) return true;
  }
  return false;
};

/*
exports.getTokensToBurn24h = (memberCount) => {
  return Math.pow(memberCount, 1 / 1.5);
};*/

export const extractPage = (args, entriesPerPage) => {
  let page = 1;

  for (let i = 0; i < args.length; i++) {
    if (+args[i]) page = Math.min(args.splice(i, 1), 100);
  }

  const from = Math.max((page - 1) * entriesPerPage + 1);
  const to = page * entriesPerPage;

  return { page, from, to };
};

export const extractPageSimple = (page, entriesPerPage) => {
  const from = Math.max((page - 1) * entriesPerPage + 1);
  const to = page * entriesPerPage;
  return { page, from, to };
};

export const extractTime = (args) => {
  let time = 'Alltime';

  for (let i = 0; i < args.length; i++) {
    if (args[i] == 'year' || args[i] == 'month' || args[i] == 'week' || args[i] == 'day')
      time = capitalizeFirstLetter(args[i]);
  }

  return time;
};

export const capitalizeFirstLetter = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

export const getLevel = (levelProgression) => {
  return Math.floor(levelProgression);
};

export const getLevelProgression = (totalScore, levelFactor) => {
  return solve(levelFactor / 2, levelFactor / 2 + 100, -totalScore) + 1;
};

function solve(a, b, c) {
  const result = (-1 * b + Math.sqrt(Math.pow(b, 2) - 4 * a * c)) / (2 * a);
  const result2 = (-1 * b - Math.sqrt(Math.pow(b, 2) - 4 * a * c)) / (2 * a);

  if (result >= 0) return result;
  if (result2 >= 0) return result2;
  else return null;
}

export const getPatreonTiers = async (interaction) => {
  const ownerUser = (
    await interaction.guild.members.fetch({ user: interaction.guild.ownerId, cache: true })
  ).user;

  await userModel.cache.load(interaction.user);
  await userModel.cache.load(ownerUser);

  const myUser = await userModel.storage.get(interaction.user);
  const myOwnerUser = await userModel.storage.get(ownerUser);

  let userTier;
  if (Date.now() / 1000 <= myUser.patreonTierUntilDate) {
    userTier = myUser.patreonTier;
  } else userTier = 0;

  let ownerTier;
  if (Date.now() / 1000 <= myOwnerUser.patreonTierUntilDate) {
    ownerTier = myOwnerUser.patreonTier;
  } else ownerTier = 0;

  return { userTier, ownerTier };
};

export const getVoteMultiplier = (myUser) => {
  let multiplier = 1;

  if (myUser.lastTopggUpvoteDate + 259200 > Date.now() / 1000) multiplier = 2;

  if (myUser.patreonTierUntilDate > Date.now() / 1000 && myUser.patreonTier > 0) {
    if (myUser.patreonTier == 1) multiplier = 2;
    else if (myUser.patreonTier == 2) multiplier = 3;
    else if (myUser.patreonTier == 3) multiplier = 4;
  }

  return multiplier;
};

export const getPatreonTierName = (tier) => {
  if (tier == 3) return 'Serveradmin';
  else if (tier == 2) return 'Poweruser';
  else if (tier == 1) return 'Supporter';
  else return 'No tier';
};
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

// GENERATED: start of generated content by `exports-to-default`.
// [GENERATED: exports-to-default:v0]

export default {
  maxBigInt,
  minIdInt,
  conditionsToSQL,
  waitAndReboot,
  sleep,
  isDateInThePast,
  dateDifferenceSec,
  dateTimeString,
  hasNoXpRole,
  extractPage,
  extractPageSimple,
  extractTime,
  capitalizeFirstLetter,
  getLevel,
  getLevelProgression,
  getPatreonTiers,
  getVoteMultiplier,
  getPatreonTierName,
};

// GENERATED: end of generated content by `exports-to-default`.
