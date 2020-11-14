const guildMemberModel = require('../models/guild/guildMemberModel.js');
const levelManager = require('../levelManager.js');
const guildModel = require('../models/guild/guildModel.js');
const userModel = require('../models/userModel.js');
const guildRoleModel = require('../models/guild/guildRoleModel.js');
const fct = require('../../util/fct.js');
const Discord = require('discord.js');
const emoji = require('node-emoji');
const cooldownUtil = require('../util/cooldownUtil.js');
const statFlushCache = require('../statFlushCache.js');
const skip = require('../skip.js');

module.exports = (reaction) => {
  return new Promise(async function (resolve, reject) {
    try {
      if (!reaction.message.guild)
        return resolve();
      const guild = reaction.message.guild;

      if (skip(reaction.message.guild))
        return resolve();

      if (reaction.message.author.bot)
        return resolve();

      await guildModel.cache.load(guild);

      if (!reaction._emoji.id) {
        if (reaction._emoji.name != emoji.get(guild.appData.voteEmote) && reaction._emoji.name != guild.appData.voteEmote)
          return resolve();
      } else {
        if ('<:' + reaction._emoji.name + ':' + reaction._emoji.id + '>' != guild.appData.voteEmote)
          return resolve();
      }

      let targetMember = guild.members.cache.get(reaction.message.author.id);
      if (!targetMember)
          targetMember = guild.members.fetch(reaction.message.author.id);
      let member = guild.members.cache.get(reaction.users.cache.last().id);
      if (!member)
          member = guild.members.fetch(reaction.users.cache.last().id);

      if (!targetMember || !member || member.user.bot)
        return resolve();

      if (targetMember.id == member.id)
        return resolve();

      await guildMemberModel.cache.load(member);
      await guildMemberModel.cache.load(targetMember);

      if (!guild.appData.reactionVote || !member.appData.reactionVote)
        return resolve();

      for (let role of targetMember.roles.cache) {
        role = role[1];
        await guildRoleModel.cache.load(role);

        if (role.appData.noXp)
          return resolve();
      }

      // Get author multiplier
      await userModel.cache.load(member.user);
      const myUser = await userModel.storage.get(member.user);
      const nowDate = Date.now() / 1000;

      let value = 1;

      if (myUser.voteMultiplierUntil > nowDate)
        value = value * myUser.voteMultiplier;

      const toWait = cooldownUtil.getCachedCooldown(member.appData,'lastVoteDate',guild.appData.voteCooldownSeconds);
      if (toWait > 0)
        return resolve();

      member.appData.lastVoteDate = nowDate;

      await statFlushCache.addVote(targetMember,value);

      resolve();
    } catch (e) { reject(e); }
  });
}

const aaa = (bbb,ccc) => {
  return new Promise(async function (resolve, reject) {
    try {


      resolve();
    } catch (e) { reject(e); }
  });
};
