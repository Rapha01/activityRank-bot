const statFlushCache = require('../statFlushCache.js');
const guildMemberModel = require('../models/guild/guildMemberModel.js');
const guildRoleModel = require('../models/guild/guildRoleModel.js');
const guildModel = require('../models/guild/guildModel.js');
const userModel = require('../models/userModel.js');
const fetch = require('node-fetch');
const fct = require('../../fct.js');

module.exports = (msg,args,command) => {
  return new Promise(async function (resolve, reject) {
    try {
      // Check Command cooldown
      await guildMemberModel.cache.load(msg.member);
      const cd = fct.getActionCooldown(msg.member.appData,'lastVoteDate',120);
      if (cd > 0) {
        await msg.channel.send('You already voted recently. Please wait ' + Math.ceil(cd / 60) + ' more minutes.');
        return resolve();
      }

      const myGuild = await guildModel.storage.get(msg.guild);
      if (command == 'down' && !myGuild.allowDownVotes) {
        await msg.channel.send('Downvotes are disabled for this server.');
        return resolve();
      }

      let userName = args.join(' ');
      const targetMemberId = await fct.extractUserId(msg,userName);
      if (!targetMemberId)
        return resolve();

      if (targetMemberId == msg.author.id) {
        await msg.channel.send('You cannot vote for yourself.');
        return resolve();
      }

      const targetMember = msg.guild.members.cache.get(targetMemberId);
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
      const user = await userModel.storage.get(msg.member.user);
      const nowDate = new Date() / 1000;

      let value = 0;
      if (command == 'up')
        value = 1;
      else if (command == 'down')
        value = -1;
      if (user.voteMultiplierUntil > nowDate)
        value = value * user.voteMultiplier;

      msg.member.appData.lastVoteDate = nowDate;
      //await statFlushCache.addVote(member,value);

      const upvoteStr = '';
      if (user.voteMultiplier < 2)
        await msg.channel.send('Vote registered. You can increase your voting ' +
            'power via the ``' + msg.guild.appData.prefix + 'redeem`` command.');
      else
        await msg.channel.send('Vote registered. Your vote counts ' + user.voteMultiplier + 'x.');
      resolve();
    } catch (e) { reject(e); }
  });
}

/*
function getMultiplier(userId,nowDate) {
  return new Promise(async function (resolve, reject) {
    try {
      let multiplier = 1;
      const externUpvote = await externUpvoteModel.getNewest(userId);

      if (externUpvote) {
        const dateaddedDate = new Date(externUpvote.dateadded);
        if (Math.abs(fct.dateDifferenceSec(nowDate,dateaddedDate)) < 86000)
          multiplier += 2;
      }

      const myProducts = await productModel.getByType('user');
      if (hasActiveSubscription(userId,myProducts,'supporter1'))
        multiplier += 1;
      if (hasActiveSubscription(userId,myProducts,'supporter2'))
        multiplier += 2;
      if (hasActiveSubscription(userId,myProducts,'supporter3'))
        multiplier += 3;

      resolve(multiplier);
    } catch (e) { reject(e); }
  });
}

function hasActiveSubscription(userId,myProducts,plan) {
  for (product of myProducts) {
    if (product.type == 'user' && product.typeid == userId && product.plan == plan)
      return true;
  }
  return false;
}*/
