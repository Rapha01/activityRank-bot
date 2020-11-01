const guildMemberModel = require('../../models/guild/guildMemberModel.js');
const guildModel = require('../../models/guild/guildModel.js');
const rankModel = require('../../models/rankModel.js');
const userModel = require('../../models/userModel.js');
const fct = require('../../../util/fct.js');
const Discord = require('discord.js');
const errorMsgs = require('../../../const/errorMsgs.js');

module.exports = (msg,targetUserId,args) => {
  return new Promise(async function (resolve, reject) {
    try {
      await guildMemberModel.cache.load(msg.member);
      const myGuild = await guildModel.storage.get(msg.guild);
      // Check Command cooldown

      const isPremiumGuild = fct.isPremiumGuild(msg.guild);
      const cd = fct.isPremiumGuild(msg.guild) ? 5 : 30;
      const premiumLowersCooldownString = isPremiumGuild ? '' : errorMsgs.premiumLowersCooldown;

      const toWait = fct.getMemberActionCooldown(msg.member,'lastStatsCmdDate',cd);
      if (toWait > 0) {
        await msg.channel.send(errorMsgs.activeStatsCooldown(cd,toWait) + premiumLowersCooldownString);
        return resolve();
      }

      if (!targetUserId)
        targetUserId = msg.author.id;

      msg.member.appData.lastStatsCmdDate = Date.now() / 1000;

      await sendMemberEmbed(msg,myGuild,targetUserId);

      console.log('  Sent score.');
      return resolve();
    } catch (e) { return reject(e); }
  });
}

function sendMemberEmbed(msg,myGuild,targetUserId) {
  return new Promise(async function (resolve, reject) {
    try {
      let voiceChannelsString = '';
      let textChannelsString = '';

      const rank = await rankModel.getGuildMemberRank(msg.guild,targetUserId);
      const max = await rankModel.countGuildRanks(msg.guild);

      const totalScorePositionAlltime = await rankModel.getGuildMemberRankPosition(msg.guild,targetUserId,'totalScoreAlltime');
      const totalScorePositionYear = await rankModel.getGuildMemberRankPosition(msg.guild,targetUserId,'totalScoreYear');
      const totalScorePositionMonth = await rankModel.getGuildMemberRankPosition(msg.guild,targetUserId,'totalScoreMonth');
      const totalScorePositionWeek = await rankModel.getGuildMemberRankPosition(msg.guild,targetUserId,'totalScoreWeek');
      const totalScorePositionDay = await rankModel.getGuildMemberRankPosition(msg.guild,targetUserId,'totalScoreDay');

      const voicePositionAlltime = await rankModel.getGuildMemberRankPosition(msg.guild,targetUserId,'voiceMinuteAlltime');
      const voicePositionYear = await rankModel.getGuildMemberRankPosition(msg.guild,targetUserId,'voiceMinuteYear');
      const voicePositionMonth = await rankModel.getGuildMemberRankPosition(msg.guild,targetUserId,'voiceMinuteMonth');
      const voicePositionWeek = await rankModel.getGuildMemberRankPosition(msg.guild,targetUserId,'voiceMinuteWeek');
      const voicePositionDay = await rankModel.getGuildMemberRankPosition(msg.guild,targetUserId,'voiceMinuteDay');

      const textPositionAlltime = await rankModel.getGuildMemberRankPosition(msg.guild,targetUserId,'textMessageAlltime');
      const textPositionYear = await rankModel.getGuildMemberRankPosition(msg.guild,targetUserId,'textMessageYear');
      const textPositionMonth = await rankModel.getGuildMemberRankPosition(msg.guild,targetUserId,'textMessageMonth');
      const textPositionWeek = await rankModel.getGuildMemberRankPosition(msg.guild,targetUserId,'textMessageWeek');
      const textPositionDay = await rankModel.getGuildMemberRankPosition(msg.guild,targetUserId,'textMessageDay');

      const votePositionAlltime = await rankModel.getGuildMemberRankPosition(msg.guild,targetUserId,'voteScoreAlltime');
      const votePositionYear = await rankModel.getGuildMemberRankPosition(msg.guild,targetUserId,'voteScoreYear');
      const votePositionMonth = await rankModel.getGuildMemberRankPosition(msg.guild,targetUserId,'voteScoreMonth');
      const votePositionWeek = await rankModel.getGuildMemberRankPosition(msg.guild,targetUserId,'voteScoreWeek');
      const votePositionDay = await rankModel.getGuildMemberRankPosition(msg.guild,targetUserId,'voteScoreDay');

      const bonusPositionAlltime = await rankModel.getGuildMemberRankPosition(msg.guild,targetUserId,'bonusScoreAlltime');
      const bonusPositionYear = await rankModel.getGuildMemberRankPosition(msg.guild,targetUserId,'bonusScoreYear');
      const bonusPositionMonth = await rankModel.getGuildMemberRankPosition(msg.guild,targetUserId,'bonusScoreMonth');
      const bonusPositionWeek = await rankModel.getGuildMemberRankPosition(msg.guild,targetUserId,'bonusScoreWeek');
      const bonusPositionDay = await rankModel.getGuildMemberRankPosition(msg.guild,targetUserId,'bonusScoreDay');

      const voiceChannelRanksMonth = await rankModel.getGuildMemberChannelRanks(msg.guild,targetUserId,'voiceMinute','month',1,5);
      const textChannelRanksMonth = await rankModel.getGuildMemberChannelRanks(msg.guild,targetUserId,'textMessage','month',1,5);

      let channelName = '';
      if (voiceChannelRanksMonth) {
        for (let i = 0; i < voiceChannelRanksMonth.length;i++) {
          channelName = fct.getChannelName(msg.guild.channels.cache,voiceChannelRanksMonth[i].channelId);

          voiceChannelsString += '#' + (i+1) + ' ' + channelName + ' (' +
              (Math.round(voiceChannelRanksMonth[i]['month'] / 60 * 10) / 10) + ')\n';
        }
      }

      if (textChannelRanksMonth) {
        for (i = 0; i < textChannelRanksMonth.length;i++) {
          channelName = fct.getChannelName(msg.guild.channels.cache,textChannelRanksMonth[i].channelId);

          textChannelsString += '#' + (i+1) + ' ' + channelName + ' (' +
              textChannelRanksMonth[i]['month'] + ')\n';
        }
      }

      const levelProgression = fct.getLevelProgression(rank.totalScoreAlltime,msg.guild.appData.levelFactor);
      const level = fct.getLevel(levelProgression);

      let description = '';
      if (myGuild.bonusUntilDate > Date.now() / 1000)
        description = '**!! Bonus XP Active !!** (' + (Math.round(((myGuild.bonusUntilDate - Date.now() / 1000)/60/60)*10)/10)+'h left) \n';

      const targetMember = msg.guild.members.cache.get(targetUserId);
      if (!targetMember) {
        await msg.channel.send('Could not find member.');
        return resolve();
      }
      const myTargetMember = await guildMemberModel.storage.get(msg.guild,targetUserId);

      await userModel.cache.load(targetMember.user);
      const myTargetUser = await userModel.storage.get(targetMember.user);

      const embed = new Discord.MessageEmbed()
          .setTitle('')
          .setAuthor('Stats for ' + fct.getGuildMemberAlias(targetMember) + ' on server ' + msg.guild.name, '')
          .setColor('#4fd6c8')
          .setDescription(description)
          .setThumbnail(targetMember.user.avatarURL())
          .setFooter(msg.client.appData.settings.footer)
          .addField('Level ' + level + ' (' + rank.totalScoreAlltime + ' XP)','Progress to next level: ' + (Math.floor(levelProgression % 1 * 100)) + '%\n')
          .addField('Tokens','Available: ' + myTargetUser.tokens + '\nBurned (this server): ' + myTargetMember.tokensBurned + '\nBought (total): ' + myTargetUser.tokensBought)
          .addField(':microphone2: (hours)',
              '  Alltime #' + voicePositionAlltime + ' (' + (Math.round(rank.voiceMinuteAlltime / 60 * 10) / 10) + ')\n' +
              '  Year #' + voicePositionYear + ' (' + (Math.round(rank.voiceMinuteYear / 60 * 10) / 10) + ')\n' +
              '  Month #' + voicePositionMonth + ' (' + (Math.round(rank.voiceMinuteMonth / 60 * 10) / 10) + ')\n' +
              '  Week #' + voicePositionWeek + ' (' + (Math.round(rank.voiceMinuteWeek / 60 * 10) / 10) + ')\n' +
              '  Day #' + voicePositionDay + ' (' + (Math.round(rank.voiceMinuteDay / 60 * 10) / 10) + ')',true)
          .addField(':writing_hand: (messages)',
              '  Alltime #' + textPositionAlltime + ' (' + Math.round(rank.textMessageAlltime) + ')\n' +
              '  Year #' + textPositionYear + ' (' + Math.round(rank.textMessageYear) + ')\n' +
              '  Month #' + textPositionMonth + ' (' + Math.round(rank.textMessageMonth) + ')\n' +
              '  Week #' + textPositionWeek + ' (' + Math.round(rank.textMessageWeek) + ')\n' +
              '  Day #' + textPositionDay + ' (' + Math.round(rank.textMessageDay) + ')',true)
          .addField(myGuild.voteEmote + ' (' + myGuild.voteTag + ')',
              '  Alltime #' + votePositionAlltime + ' (' + Math.round(rank.voteAlltime) + ')\n' +
              '  Year #' + votePositionYear + ' (' + Math.round(rank.voteYear) + ')\n' +
              '  Month #' + votePositionMonth + ' (' + Math.round(rank.voteMonth) + ')\n' +
              '  Week #' + votePositionWeek + ' (' + Math.round(rank.voteWeek) + ')\n' +
              '  Day #' + votePositionDay + ' (' + Math.round(rank.voteDay) + ')',true)
          .addField(myGuild.bonusEmote + ' (' + myGuild.bonusTag + ')',
              '  Alltime #' + bonusPositionAlltime + ' (' + Math.round(rank.bonusAlltime) + ')\n' +
              '  Year #' + bonusPositionYear + ' (' + Math.round(rank.bonusYear) + ')\n' +
              '  Month #' + bonusPositionMonth + ' (' + Math.round(rank.bonusMonth) + ')\n' +
              '  Week #' + bonusPositionWeek + ' (' + Math.round(rank.bonusWeek) + ')\n' +
              '  Day #' + bonusPositionDay + ' (' + Math.round(rank.bonusDay) + ')',true)
          .addField('Total (XP)',
              '  Alltime #' + totalScorePositionAlltime + ' (' + Math.round(rank.totalScoreAlltime) + ')\n' +
              '  Year #' + totalScorePositionYear + ' (' + Math.round(rank.totalScoreYear) + ')\n' +
              '  Month #' + totalScorePositionMonth + ' (' + Math.round(rank.totalScoreMonth) + ')\n' +
              '  Week #' + totalScorePositionWeek + ' (' + Math.round(rank.totalScoreWeek) + ')\n' +
              '  Day #' + totalScorePositionDay + ' (' + Math.round(rank.totalScoreDay) + ')',true)

      if (voiceChannelsString != '')
        embed.addField('Most active voicechannels this Month (hours)',voiceChannelsString)
      if (textChannelsString != '')
        embed.addField('Most active textchannels this Month (messages)',textChannelsString)

      await msg.channel.send({embed});
      resolve();
    } catch (e) { return reject(e); }
  });
}
