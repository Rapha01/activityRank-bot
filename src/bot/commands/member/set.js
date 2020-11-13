const guildMemberModel = require('../../models/guild/guildMemberModel.js');
const errorMsgs = require('../../../const/errorMsgs.js');

module.exports = (msg,targetUserId,args) => {
  return new Promise(async function (resolve, reject) {
    try {
      if (args.length < 1) {
        await msg.channel.send(errorMsgs.tooFewArguments.replace('<prefix>',msg.guild.appData.prefix));
        return resolve();
      }

      const field = args[0].toLowerCase();
      const value = args.slice(1,args.length+1).join(' ');

      if (!targetUserId)
        targetUserId = msg.member.id;

      if (field == 'notifylevelupdm')
        await notifylevelupdm(msg,targetUserId);
      if (field == 'reactionvote')
        await reactionVote(msg,targetUserId);
      else {
        await msg.channel.send(errorMsgs.invalidArgument.replace('<prefix>',msg.guild.appData.prefix));
        return resolve();
      }
    } catch (e) { reject(e); }
    resolve();
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
