const guildMemberModel = require('../../models/guild/guildMemberModel.js');
const guildModel = require('../../models/guild/guildModel.js');
const rankModel = require('../../models/rankModel.js');
const userModel = require('../../models/userModel.js');
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

      const time = fct.extractTime(args);
      await sendMemberEmbed(msg,myGuild,targetUserId,time);

      console.log('  Sent score.');
      return resolve();
    } catch (e) { return reject(e); }
  });
}

function sendMemberEmbed(msg,myGuild,targetUserId,time) {
  return new Promise(async function (resolve, reject) {
    try {
      const targetMember = await msg.guild.members.fetch(targetUserId);
      if (!targetMember) {
        await msg.channel.send('Could not find member.');
        return resolve();
      }

      const rank = await rankModel.getGuildMemberRank(msg.guild,targetUserId);
      const max = await rankModel.countGuildRanks(msg.guild);

      const textPosition = await rankModel.getGuildMemberRankPosition(msg.guild,targetUserId,'textMessage' + time);
      const voicePosition = await rankModel.getGuildMemberRankPosition(msg.guild,targetUserId,'voiceMinute' + time);
      const invitePosition = await rankModel.getGuildMemberRankPosition(msg.guild,targetUserId,'invite' + time);
      const votePosition = await rankModel.getGuildMemberRankPosition(msg.guild,targetUserId,'vote' + time);
      const bonusPosition = await rankModel.getGuildMemberRankPosition(msg.guild,targetUserId,'bonus' + time);
      const totalScorePosition = await rankModel.getGuildMemberRankPosition(msg.guild,targetUserId,'totalScore' + time);

      const guildMemberInfo = await nameUtil.getGuildMemberInfo(msg.guild, targetUserId);
      const levelProgression = fct.getLevelProgression(rank.totalScoreAlltime,msg.guild.appData.levelFactor);

      let description = '';
      if (myGuild.bonusUntilDate > Date.now() / 1000)
        description = '**!! Bonus XP Active !!** (' + (Math.round(((myGuild.bonusUntilDate - Date.now() / 1000)/60/60)*10)/10)+'h left) \n';

      const myTargetMember = await guildMemberModel.storage.get(msg.guild,targetUserId);

      await userModel.cache.load(targetMember.user);
      const myTargetUser = await userModel.storage.get(targetMember.user);

      let embed = new Discord.MessageEmbed()
          .setTitle('')
          .setAuthor(time + ' stats on server ' + msg.guild.name, '')
          .setColor('#4fd6c8')
          .setDescription(description)
          .setThumbnail(targetMember.user.avatarURL({dynamic:true}))
          .setFooter(msg.client.appData.settings.footer ? msg.client.appData.settings.footer : '')

      let scoreStrings = [];
      let infoStrings = [];
      if (msg.guild.appData.textXp)
        scoreStrings.push(':writing_hand:' + ' ' + rank['textMessage' + time] + ' (#' + textPosition + ')');
      if (msg.guild.appData.voiceXp)
        scoreStrings.push(':microphone2:'  + ' ' + (Math.round(rank['voiceMinute' + time] / 60 * 10) / 10) + ' (#' + voicePosition + ')');
      if (msg.guild.appData.inviteXp)
        scoreStrings.push(':envelope:' + ' ' + rank['invite' + time] + ' (#' + invitePosition + ')');
      if (msg.guild.appData.voteXp)
        scoreStrings.push(myGuild.voteEmote + ' ' + rank['vote' + time] + ' (#' + votePosition + ')');
      if (msg.guild.appData.bonusXp)
        scoreStrings.push(myGuild.bonusEmote + ' ' + rank['bonus' + time] + ' (#' + bonusPosition + ')');

      infoStrings.push('Total XP: ' + Math.round(rank['totalScore' + time]) + ' (#' + totalScorePosition + ')');
      infoStrings.push('Next Level: ' + (Math.floor(levelProgression % 1 * 100)) + '%\n');


      embed.addField('#' + totalScorePosition + ' **' + guildMemberInfo.name + '** \\🎖' + Math.floor(levelProgression),infoStrings.join('\n'));
      embed.addField('Stats',scoreStrings.join('\n'));


      await msg.channel.send({ embeds: [ embed ] });
      resolve();
    } catch (e) { return reject(e); }
  });
}
