const guildMemberModel = require('../../models/guild/guildMemberModel.js');
const errorMsgs = require('../../../const/errorMsgs.js');
const statFlushCache = require('../../statFlushCache.js');
const fct = require('../../../util/fct.js');

module.exports = (msg,targetUserId,args) => {
  return new Promise(async function (resolve, reject) {
    try {
      if (args.length < 1) {
        await msg.channel.send(errorMsgs.tooFewArguments.replace('<prefix>',msg.guild.appData.prefix));
        return resolve();
      }

      const field = args[0].toLowerCase();
      const value = args.slice(1,args.length+1).join(' ');

      await guildMemberModel.cache.load(msg.member);

      if (!targetUserId)
        targetUserId = msg.member.id;

      if (field == 'notifylevelupdm')
        await notifylevelupdm(msg,targetUserId);
      else if (field == 'reactionvote')
        await reactionVote(msg,targetUserId);
      else if (field == 'inviter')
        await inviter(msg,targetUserId);
      else {
        await msg.channel.send(errorMsgs.invalidArgument.replace('<prefix>',msg.guild.appData.prefix));
        return resolve();
      }
    } catch (e) { reject(e); }
    resolve();
  });
}

function inviter(msg,targetUserId) {
  return new Promise(async function (resolve, reject) {
    try {
      if (!msg.guild.appData.inviteXp) {
        await msg.channel.send('The invite XP module is paused on this server.');
        return resolve();
      }

      if (targetUserId == msg.member.id) {
        await msg.channel.send('You cannot be the inviter of yourself.');
        return resolve();
      }

      const myGuildMember = await guildMemberModel.storage.get(msg.guild,msg.member.id);
      const myTargetGuildMember = await guildMemberModel.storage.get(msg.guild,targetUserId);

      if (myGuildMember.inviter != 0) {
        await msg.channel.send('You have already set your inviter. This setting is final.');
        return resolve();
      }

      if (myTargetGuildMember.inviter != 0 && myTargetGuildMember.inviter == msg.member.id) {
        await msg.channel.send('You cannot set your inviter to a person who has been invited by you.');
        return resolve();
      }

      const targetMember = await msg.guild.members.fetch({user: targetUserId, withPresences:false, cache: false});

      if (!targetMember) {
        await msg.channel.send('Cannot find member. Your inviter has to be in this guild.');
        return resolve();
      }
      await guildMemberModel.cache.load(targetMember);

      if (await fct.hasNoXpRole(targetMember)) {
        await msg.channel.send('The member you are trying to set as your inviter cannot be selected, because of an assigned noXP role.');
        return resolve();
      }

      await guildMemberModel.storage.set(msg.guild,msg.member.id,'inviter',targetUserId);

      await statFlushCache.addInvite(targetMember,1);
      await statFlushCache.addBonus(msg.member,msg.guild.appData.xpPerInvite);

      await msg.channel.send('Your inviter has been set successfully. You will both get 1 invite added to your stats.');
      resolve();
    } catch (e) { reject(e); }
  });
}

function notifylevelupdm(msg,targetUserId) {
  return new Promise(async function (resolve, reject) {
    try {
      if (targetUserId != msg.member.id) {
        await msg.channel.send('This setting is personal and cannot be changed for other members.');
        return resolve();
      }

      const myGuildMember = await guildMemberModel.storage.get(msg.guild,targetUserId);

      if (myGuildMember.notifyLevelupDm) {
        await guildMemberModel.storage.set(msg.guild,targetUserId,'notifyLevelupDm',0);
        await msg.channel.send('You will no longer receive levelup messages per dm from me.');
      } else {
        await guildMemberModel.storage.set(msg.guild,targetUserId,'notifyLevelupDm',1);
        await msg.channel.send('You will receive levelup messages per dm from me.');
      }

      resolve();
    } catch (e) { reject(e); }
  });
}

function reactionVote(msg,targetUserId) {
  return new Promise(async function (resolve, reject) {
    try {
      if (targetUserId != msg.member.id) {
        await msg.channel.send('This setting is personal and cannot be changed for other members.');
        return resolve();
      }

      const myGuildMember = await guildMemberModel.storage.get(msg.guild,targetUserId);

      if (myGuildMember.reactionVote) {
        await guildMemberModel.storage.set(msg.guild,targetUserId,'reactionVote',0);
        await msg.channel.send('Your reactions with the voteEmote ('+msg.guild.appData.voteEmote+') will no longer count as an ActivityRank vote.');
      } else {
        await guildMemberModel.storage.set(msg.guild,targetUserId,'reactionVote',1);
        await msg.channel.send('Your reactions with the voteEmote ('+msg.guild.appData.voteEmote+') will now count as an ActivityRank vote (as long as the serveradmin has enabled the corresponding server setting).');
      }

      resolve();
    } catch (e) { reject(e); }
  });
}
