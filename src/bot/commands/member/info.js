const guildMemberModel = require('../../models/guild/guildMemberModel.js');
const guildModel = require('../../models/guild/guildModel.js');
const rankModel = require('../../models/rankModel.js');
const userModel = require('../../models/userModel.js');
const utilModel = require('../../models/utilModel.js');
const fct = require('../../../util/fct.js');
const nameUtil = require('../../util/nameUtil.js');
const Discord = require('discord.js');
const errorMsgs = require('../../../const/errorMsgs.js');
const cooldownUtil = require('../../util/cooldownUtil.js');

module.exports = (msg,targetUserId,args) => {
  return new Promise(async function (resolve, reject) {
    try {
      await guildMemberModel.cache.load(msg.member);
      const myGuild = await guildModel.storage.get(msg.guild);

      if (!targetUserId)
        targetUserId = msg.author.id;

      if (!await cooldownUtil.checkStatCommandsCooldown(msg)) return resolve();

      await sendMemberInfoEmbed(msg,myGuild,targetUserId);

      return resolve();
    } catch (e) { return reject(e); }
  });
}

function sendMemberInfoEmbed(msg,myGuild,targetUserId) {
  return new Promise(async function (resolve, reject) {
    try {
      const user = await msg.client.users.fetch(targetUserId);
      if (!user) {
        await msg.channel.send(errorMsgs.userNotFound);
        return resolve();
      }
      await userModel.cache.load(user);
      const myTargetUser = await userModel.storage.get(user);

      const myTargetMember = await guildMemberModel.storage.get(msg.guild,targetUserId);
      const targetMemberInfo = await nameUtil.getGuildMemberInfo(msg.guild,targetUserId);

      const lastActivities = await utilModel.storage.getLastActivities(msg.guild,targetUserId);
      const inviterInfo = await nameUtil.getGuildMemberInfo(msg.guild,myTargetMember.inviter);
      if (inviterInfo.name == 'User left [0]') inviterInfo.name = 'No inviter set. Use ``'+msg.guild.appData.prefix+'m @member set inviter`` to set one!';

      let lastActivityStr = '';
      if (msg.guild.appData.textXp)
        lastActivityStr += 'Last textmessage: ' + lastActivities.textMessage + '\n';
      if (msg.guild.appData.voiceXp)
        lastActivityStr += 'Last voiceminute: ' + lastActivities.voiceMinute + '\n';
      if (msg.guild.appData.inviteXp)
        lastActivityStr += 'Last invite: ' + lastActivities.invite + '\n';
      if (msg.guild.appData.voteXp)
        lastActivityStr += 'Last vote: ' + lastActivities.vote + '\n';
      if (msg.guild.appData.bonusXp)
        lastActivityStr += 'Last bonus: ' + lastActivities.bonus + '\n';

      const embed = new Discord.MessageEmbed()
          .setTitle('')
          .setAuthor('Info for ' + targetMemberInfo.name + ' on server ' + msg.guild.name, '')
          .setColor('#4fd6c8')
          .setThumbnail(targetMemberInfo.avatarUrl)
          .setFooter(msg.client.appData.settings.footer)
          .addField('General',
              'Joined: ' + (new Date(targetMemberInfo.joinedAt)).toString().slice(0,16)  + '\n' +
              'Inviter: ' + inviterInfo.name )
          .addField('Tokens','Available: ' + myTargetUser.tokens + '\nBurned (this server): ' + myTargetMember.tokensBurned + '\nBought (total): ' + myTargetUser.tokensBought)
          .addField('Settings',
              'Notify levelup direct message: ' + (myGuild.notifyLevelupDm ? 'Yes' : 'No') + '.\n' +
              'Reaction vote: ' + (myGuild.reactionVote ? 'Yes' : 'No') + '.\n' )
          .addField('Recent Activity',lastActivityStr)
          .addField('Stats','Rank: Use ``' + msg.guild.appData.prefix + 'm stats``.\n' + 'Channels: Use ``' + msg.guild.appData.prefix + 'm top channels``.');



      await msg.channel.send({embed});
      resolve();
    } catch (e) { return reject(e); }
  });
}
