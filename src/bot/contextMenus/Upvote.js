const { ContextMenuCommandBuilder } = require('@discordjs/builders');
const statFlushCache = require('../statFlushCache.js');
const guildMemberModel = require('../models/guild/guildMemberModel.js');
const userModel = require('../models/userModel.js');
const fct = require('../../util/fct.js');
const cooldownUtil = require('../util/cooldownUtil.js');

module.exports = {
  data: new ContextMenuCommandBuilder()
    .setName('Upvote')
    .setType(2), //User
  async execute(i) {
    if (!i.guild.appData.voteXp)
      return await i.reply({ content: 'Voting is disabled on this server.', ephemeral: true });
    
    const targetMember = await i.guild.members.fetch(i.targetId);

    if (!targetMember)
      return await i.reply({ content: 'Could not find member.', ephemeral: true });
    
    await guildMemberModel.cache.load(i.member);
    await guildMemberModel.cache.load(targetMember);

    if (targetMember.user.bot)
      return await i.reply({ content: 'You cannot upvote bots.', ephemeral: true });

    if (i.targetId == i.member.id)
      return await i.reply({ content: 'You cannot upvote yourself.', ephemeral: true });

    if (await fct.hasNoXpRole(targetMember))
      return await i.reply({ content: 'The member you are trying to upvote cannot be upvoted, because of an assigned noxp role.', ephemeral: true });

    // Get author multiplier
    await userModel.cache.load(i.user);
    const myUser = await userModel.storage.get(i.user);
    const nowDate = Date.now() / 1000;

    let value = 1;

    if (myUser.voteMultiplierUntil > nowDate)
      value = value * myUser.voteMultiplier;
    
    // Check Command cooldown

    const toWait = cooldownUtil.getCachedCooldown(i.member.appData, 'lastVoteDate', i.guild.appData.voteCooldownSeconds);
    if (toWait > 0)
      return await i.reply({ content: `You already voted recently. Please wait ${Math.ceil(toWait / 60)} more minutes.`, ephemeral: true });

    i.member.appData.lastVoteDate = nowDate;

    await statFlushCache.addVote(targetMember, value);

    if (myUser.voteMultiplierUntil > nowDate)
      await i.reply('Vote registered. Your vote counts ' + myUser.voteMultiplier + 'x.');
    else
      await i.reply('Vote registered. Check ``' + i.guild.appData.prefix + 'help token`` for info on how to increase your voting power.');
  }
}

/* const statFlushCache = require('../../statFlushCache.js');
const guildMemberModel = require('../../models/guild/guildMemberModel.js');
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

      const targetMember = await msg.guild.members.fetch(targetUserId);

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

      if (await fct.hasNoXpRole(targetMember)) {
        await msg.channel.send('The member you are trying to upvote cannot be upvoted, because of an assigned noxp role.');
        return resolve();
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
 */