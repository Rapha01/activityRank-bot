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

module.exports = (reaction) => {
  return new Promise(async function (resolve, reject) {
    try {
      if (reaction.message.author.bot)
        return resolve();
      if (!reaction.message.guild)
        return resolve();

      await guildModel.cache.load(reaction.message.guild);

      if (reaction._emoji.name != emoji.get(reaction.message.guild.appData.voteEmote))
        return resolve();

      const targetMember = reaction.message.guild.members.cache.get(reaction.message.author.id);

      const member = reaction.message.guild.members.cache.get(reaction.users.cache.last().id);
      if (!targetMember || !member || member.user.bot)
        return resolve();

      if (targetMember.id == member.id)
        return resolve();

      if (!reaction.message.guild.appData.reactionVote || !member.appData.reactionVote)
        return resolve();

      await guildMemberModel.cache.load(member);
      await guildMemberModel.cache.load(targetMember);

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

      const toWait = cooldownUtil.getCachedCooldown(member.appData,'lastVoteDate',reaction.message.guild.appData.voteCooldownSeconds);
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
