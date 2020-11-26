const statFlushCache = require('../../statFlushCache.js');
const guildMemberModel = require('../../models/guild/guildMemberModel.js');
const guildRoleModel = require('../../models/guild/guildRoleModel.js');
const guildModel = require('../../models/guild/guildModel.js');
const userModel = require('../../models/userModel.js');
const fetch = require('node-fetch');
const fct = require('../../../util/fct.js');
const cooldownUtil = require('../../util/cooldownUtil.js');

module.exports = (msg,targetUserId,args) => {
  return new Promise(async function (resolve, reject) {
    try {
      if (!msg.guild.appData.voteXp) {
        await msg.channel.send('Voting is disabled on this server.');
        return resolve();
      }

      if (!targetUserId)
        targetUserId = msg.member.id;

      const targetMember = msg.guild.members.cache.get(targetUserId);

      if (!targetMember) {
        await msg.channel.send('Could not find member.');
        return resolve();
      }

      await guildMemberModel.cache.load(msg.member);
      await guildMemberModel.cache.load(targetMember);

      if (targetMember.user.bot) {
        await msg.channel.send('You cannot upvote bots.');
        return resolve();
      }

      if (targetUserId == msg.member.id) {
        await msg.channel.send('You cannot upvote yourself.');
        return resolve();
      }

      for (let role of targetMember.roles.cache) {
        role = role[1];
        await guildRoleModel.cache.load(role);

        if (role.appData.noXp) {
          await msg.channel.send('The member you are trying to upvote cannot be upvoted, because of an assigned noxp role.');
          return resolve();
        }
      }

      // Get author multiplier
      await userModel.cache.load(msg.member.user);
      const myUser = await userModel.storage.get(msg.member.user);
      const nowDate = Date.now() / 1000;

      let value = 1;

      if (myUser.voteMultiplierUntil > nowDate)
        value = value * myUser.voteMultiplier;

      // Check Command cooldown

      const toWait = cooldownUtil.getCachedCooldown(msg.member.appData,'lastVoteDate',msg.guild.appData.voteCooldownSeconds);
      if (toWait > 0) {
        await msg.channel.send('You already voted recently. Please wait ' + Math.ceil(toWait / 60) + ' more minutes.');
        return resolve();
      }
      msg.member.appData.lastVoteDate = nowDate;

      await statFlushCache.addVote(targetMember,value);

      const upvoteStr = '';
      if (myUser.voteMultiplierUntil > nowDate)
        await msg.channel.send('Vote registered. Your vote counts ' + myUser.voteMultiplier + 'x.');
      else
        await msg.channel.send('Vote registered. Check ``' + msg.guild.appData.prefix + 'help token`` for info on how to increase your voting power.');

      resolve();
    } catch (e) { reject(e); }
  });
}
