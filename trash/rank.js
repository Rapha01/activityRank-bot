const rankModel = require('../models/rankModel.js');
const guildMemberModel = require('../models/guild/guildMemberModel.js');
const guildModel = require('../models/guild/guildModel.js');
const Discord = require('discord.js');
const fct = require('../../fct.js');

module.exports = (msg,args) => {
  return new Promise(async function (resolve, reject) {
    await guildMemberModel.cache.load(msg.member);
    const myGuild = await guildModel.storage.get(msg.guild);

    // Check Command cooldown
    const cd = fct.isActivated(myGuild.tokens,msg.guild.memberCount) ? 10 : 40;
    const toWait = fct.getActionCooldown(msg.member.appData,'lastRankCmdDate',cd);
    if (toWait > 0) {
      await msg.channel.send('You can reset a user only once per ' + cd + ' seconds, please wait ' + Math.ceil(toWait) + ' more seconds. This cooldown can be reduced by activating the bot via ``' + msg.guild.appData.prefix + 'redeem``.');
      return resolve();
    }

    const userName = args.join(' ');
    let targetMemberId;
    if (userName == '')
      targetMemberId = msg.author.id;
    else
      targetMemberId = await fct.extractUserId(msg,userName);

    if (!targetMemberId)
      return resolve();

    msg.member.appData.lastRankCmdDate = new Date() / 1000;
    try {
      await sendMemberEmbed(msg,myGuild,targetMemberId);
    } catch (e) {return reject(e); }

    console.log('  Sent score.');
    return resolve();
  });
}

function sendMemberEmbed(msg,myGuild,targetMemberId) {
  return new Promise(async function (resolve, reject) {
    try {
      let voiceChannelsString = '';
      let textChannelsString = '';

      const rank = await rankModel.getGuildMemberRank(msg.guild,targetMemberId);
      const max = await rankModel.countGuildRanks(msg.guild);

      const totalScorePositionAlltime = await rankModel.getGuildMemberRankPosition(msg.guild,targetMemberId,'totalScoreAlltime');
      const totalScorePositionYear = await rankModel.getGuildMemberRankPosition(msg.guild,targetMemberId,'totalScoreYear');
      const totalScorePositionMonth = await rankModel.getGuildMemberRankPosition(msg.guild,targetMemberId,'totalScoreMonth');
      const totalScorePositionWeek = await rankModel.getGuildMemberRankPosition(msg.guild,targetMemberId,'totalScoreWeek');
      const totalScorePositionDay = await rankModel.getGuildMemberRankPosition(msg.guild,targetMemberId,'totalScoreDay');

      const voicePositionAlltime = await rankModel.getGuildMemberRankPosition(msg.guild,targetMemberId,'voiceMinuteAlltime');
      const voicePositionYear = await rankModel.getGuildMemberRankPosition(msg.guild,targetMemberId,'voiceMinuteYear');
      const voicePositionMonth = await rankModel.getGuildMemberRankPosition(msg.guild,targetMemberId,'voiceMinuteMonth');
      const voicePositionWeek = await rankModel.getGuildMemberRankPosition(msg.guild,targetMemberId,'voiceMinuteWeek');
      const voicePositionDay = await rankModel.getGuildMemberRankPosition(msg.guild,targetMemberId,'voiceMinuteDay');

      const textPositionAlltime = await rankModel.getGuildMemberRankPosition(msg.guild,targetMemberId,'textMessageAlltime');
      const textPositionYear = await rankModel.getGuildMemberRankPosition(msg.guild,targetMemberId,'textMessageYear');
      const textPositionMonth = await rankModel.getGuildMemberRankPosition(msg.guild,targetMemberId,'textMessageMonth');
      const textPositionWeek = await rankModel.getGuildMemberRankPosition(msg.guild,targetMemberId,'textMessageWeek');
      const textPositionDay = await rankModel.getGuildMemberRankPosition(msg.guild,targetMemberId,'textMessageDay');

      const votePositionAlltime = await rankModel.getGuildMemberRankPosition(msg.guild,targetMemberId,'voteScoreAlltime');
      const votePositionYear = await rankModel.getGuildMemberRankPosition(msg.guild,targetMemberId,'voteScoreYear');
      const votePositionMonth = await rankModel.getGuildMemberRankPosition(msg.guild,targetMemberId,'voteScoreMonth');
      const votePositionWeek = await rankModel.getGuildMemberRankPosition(msg.guild,targetMemberId,'voteScoreWeek');
      const votePositionDay = await rankModel.getGuildMemberRankPosition(msg.guild,targetMemberId,'voteScoreDay');

      const bonusPositionAlltime = await rankModel.getGuildMemberRankPosition(msg.guild,targetMemberId,'bonusScoreAlltime');
      const bonusPositionYear = await rankModel.getGuildMemberRankPosition(msg.guild,targetMemberId,'bonusScoreYear');
      const bonusPositionMonth = await rankModel.getGuildMemberRankPosition(msg.guild,targetMemberId,'bonusScoreMonth');
      const bonusPositionWeek = await rankModel.getGuildMemberRankPosition(msg.guild,targetMemberId,'bonusScoreWeek');
      const bonusPositionDay = await rankModel.getGuildMemberRankPosition(msg.guild,targetMemberId,'bonusScoreDay');

      const voiceChannelRanksMonth = await rankModel.getGuildMemberChannelRanks(msg.guild,targetMemberId,'voiceMinute','month',1,5);
      const textChannelRanksMonth = await rankModel.getGuildMemberChannelRanks(msg.guild,targetMemberId,'textMessage','month',1,5);

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
      const bonusTimeLeft = fct.dateDifferenceSec(new Date(msg.guild.appData.bonusUntil),new Date());
      if (bonusTimeLeft > 0)
        description = '**!! Bonus XP Active !!** (' + (Math.round((bonusTimeLeft/60/60)*10)/10)+'h left)\n';

      const targetMember = msg.guild.members.cache.get(targetMemberId);

      const embed = new Discord.MessageEmbed()
          .setTitle('')
          .setAuthor('Stats for ' + targetMember.user.username + ' on server ' + msg.guild.name, '')
          .setColor('#4fd6c8')
          .setDescription(description)
          .setThumbnail(targetMember.user.avatarURL)
          .setFooter(msg.client.appData.settings.footer)
          .addField('Level ' + level + ' (' + rank.totalScoreAlltime + ' XP)','Progress to next level: ' + (Math.floor(levelProgression % 1 * 100)) + '%\n')
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
    } catch (e) {
      return reject(e);
    }
  });
}
