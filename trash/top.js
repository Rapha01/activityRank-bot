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
    const cd = fct.isActivated(myGuild) ? 10 : 40;
    const toWait = fct.getActionCooldown(msg.member.appData,'lastTopCmdDate',cd);
    if (toWait > 0) {
      await msg.channel.send('You can display the toplist only once per ' + cd + ' seconds, please wait ' + Math.ceil(toWait) + ' more seconds. This cooldown can be reduced by activating the bot via ``' + msg.guild.appData.prefix + 'redeem``.');
      return resolve();
    }

    let page = 1;
    let time = '';
    let i;
    for (i = 0;i < args.length;i++) {
      if ((+args[i])) {
        page = Math.min(args.splice(i, 1), 100);
        break;
      }
      if (args[i] == 'channel')
        break;
    }
    if (page < 1 || page > 100) {
      await msg.channel.send('Pagenumber needs to be within 1 and 100.');
      return resolve();
    }

    const from = Math.max((page-1) * myGuild.entriesPerPage + 1);
    const to = page * myGuild.entriesPerPage;

    if ((i = args.map(t => t.toLowerCase()).indexOf('alltime')) > -1)
      time = 'Alltime';
    else if ((i = args.map(t => t.toLowerCase()).indexOf('year')) > -1)
      time = 'Year';
    else if ((i = args.map(t => t.toLowerCase()).indexOf('month')) > -1)
      time = 'Month';
    else if ((i = args.map(t => t.toLowerCase()).indexOf('week')) > -1)
      time = 'Week';
    else if ((i = args.map(t => t.toLowerCase()).indexOf('day')) > -1)
      time = 'Day';
    else
      time = 'Alltime';

    msg.member.appData.lastTopCmdDate = new Date() / 1000;

    try {
      if ((i = args.map(arg => arg.toLowerCase()).indexOf('voicechannels')) > -1) {
        args.splice(i, 1)[0];
        await sendChannelsEmbed(msg,args,myGuild,'voiceMinute',time,from,to);
      } else if ((i = args.map(arg => arg.toLowerCase()).indexOf('textchannels')) > -1) {
        args.splice(i, 1)[0];
        await sendChannelsEmbed(msg,args,myGuild,'textMessage',time,from,to);
      } else if ((i = args.indexOf('channel')) > -1) {
        args.splice(i, 1)[0];
        await sendChannelMembersEmbed(msg,args,myGuild,time,from,to);
      } else
        await sendGuildMembersEmbed(msg,args,myGuild,time,from,to);
    } catch (e) { reject(e); }
    resolve();
  });
}

function sendChannelsEmbed(msg,args,myGuild,type,time,from,to) {
  return new Promise(async function (resolve, reject) {
    try {
      if (type == 'voiceMinute')
        typestr = 'voiceChannels';
      else if (type == 'textMessage')
        typestr = 'textChannels';
      else
        return resolve();

      let header = 'Toplist for ' + typestr + ' from ' + from + ' to ' + to + ' | ';
      header += capitalizeFirstLetter(time);

      const channelRanks = await rankModel.getChannelRanks(msg.guild,type,time,from,to);

      if (!channelRanks || channelRanks.length == 0) {
        await msg.channel.send('No entries found for this page.');
        return resolve();
      }

      let embed = new Discord.MessageEmbed()
          .setTitle(header)
          .setAuthor('')
          .setColor('#4fd6c8')
          .setFooter(msg.client.appData.settings.footer);

      let str = '';
      for (let i = 0; i < channelRanks.length;i++) {
        if (type == 'voiceMinute')
          str = ':microphone2: ' + (Math.round(channelRanks[i][time] / 60 * 10) / 10);
        else if (type == 'textMessage')
          str = ':writing_hand: ' + channelRanks[i][time];

        embed.addField('#' + (from + i) + '  ' + fct.getChannelName(msg.guild.channels.cache,channelRanks[i].channelId), str);
      }

      await msg.channel.send(embed);
    } catch (e) { reject(e); }
    resolve();
  });
}

function sendChannelMembersEmbed(msg,args,myGuild,time,from,to) {
  return new Promise(async function (resolve, reject) {
    try {
      const channelName = args.join(' ');
      console.log(channelName);
      const targetChannelId = await fct.extractChannelId(msg,channelName);
      if (!targetChannelId)
        return resolve();

      const targetChannel = msg.guild.channels.cache.get(targetChannelId);
      let type;
      let header = 'Toplist for channel ' + targetChannel.name + ' from ' + from + ' to ' + to + ' | ';
      header += capitalizeFirstLetter(time);

      if (targetChannel.type == 'voice')
        type = 'voiceMinute';
      else if (targetChannel.type == 'text')
        type = 'textMessage';
      else {
        await msg.channel.send('Channel is not of type voice or text.');
        return resolve();
      }

      const channelMemberRanks = await rankModel.getChannelMemberRanks(msg.guild,targetChannel.id,type,time,from,to);

      if (!channelMemberRanks || channelMemberRanks.length == 0) {
        await msg.channel.send('No entries found for this page.');
        return resolve();
      }

      await addNames(msg,channelMemberRanks);

      let embed = new Discord.MessageEmbed()
          .setTitle(header)
          .setAuthor('')
          .setColor('#4fd6c8')
          .setFooter(msg.client.appData.settings.footer);

      let str = '';
      for (let i = 0; i < channelMemberRanks.length;i++) {
        if (type == 'voiceMinute')
          str = ':microphone2: ' + (Math.round(channelMemberRanks[i][time] / 60 * 10) / 10)
        else
          str = ':writing_hand: ' + channelMemberRanks[i][time];


        embed.addField('#' + (from + i) + '  ' + fct.getGuildMemberName(msg.guild.members.cache,channelMemberRanks[i].userId), str,true);
      }

      await msg.channel.send(embed);
    } catch (e) { reject(e); }
    resolve();
  });
}

function sendGuildMembersEmbed(msg,args,myGuild,time,from,to) {
  return new Promise(async function (resolve, reject) {
    try {
      let type;
      let header = 'Toplist for server ' + msg.guild.name + ' from ' + from + ' to ' + to + ' | ';
      header += capitalizeFirstLetter(time);

      if (args.indexOf('voice') > -1) {
        type = 'voiceMinute';
        header += ' | By voice XP';
      } else if (args.indexOf('text') > -1) {
        type = 'textMessage';
        header += ' | By text XP';
      } else if (args.indexOf(myGuild.voteTag) > -1) {
        type = 'vote';
        header += ' | By ' + myGuild.voteTag;
      } else if (args.indexOf(myGuild.bonusTag) > -1) {
        type = 'bonus';
        header += ' | By ' + myGuild.bonusTag;
      } else {
        type = 'totalScore';
        header += ' | By total XP';
      }

      const memberRanks = await rankModel.getGuildMemberRanks(msg.guild,type,time,from,to);

      if (!memberRanks || memberRanks.length == 0) {
        await msg.channel.send('No entries found for this page.');
        return resolve();
      }

      await addNames(msg,memberRanks);

      // Embed header
      let description = '';
      const bonusTimeLeft = fct.dateDifferenceSec(new Date(msg.guild.appData.bonusUntil),new Date());
      if (bonusTimeLeft > 0)
        description = '**!! Bonus XP Active !!** (' + (Math.round((bonusTimeLeft/60/60)*10)/10)+'h left)\n';

      let embed = new Discord.MessageEmbed()
          .setTitle(header)
          .setAuthor('')
          .setDescription(description)
          .setColor('#4fd6c8')
          .setFooter(msg.client.appData.settings.footer);

      let i = 0;
      let str = '';
      let memberRank;
      while (memberRanks.length > 0) {
        memberRank = memberRanks.shift();
        str = memberRank['totalScore' + time] + ' XP \\⬄ ' +
        ':microphone2: ' + (Math.round(memberRank['voiceMinute' + time] / 60 * 10) / 10)
        + ' :writing_hand: ' + memberRank['textMessage' + time] + ' '
        + myGuild.voteEmote + ' ' + memberRank['vote' + time] + ' '
        + myGuild.bonusEmote + ' ' + memberRank['bonus' + time];


        embed.addField('**#' + (from + i) + ' ' + memberRank.name + '** \\🎖' + Math.floor(memberRank.levelProgression) + '', str);
        i++;
      }

      await msg.channel.send(embed);
    } catch (e) { reject(e); }
    resolve();
  });
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

const addNames = (msg,memberRanks) => {
  return new Promise(async function (resolve, reject) {
    try {
      let memberRank,member,userIdsToFetch = [];

      for (memberRank of memberRanks) {
        member = msg.guild.members.cache.get(memberRank.userId);
        if (member)
          memberRank.name = member.user.username;
        else
          userIdsToFetch.push(memberRank.userId);
      }

      if (userIdsToFetch.length > 0) {
        const fetchedMembers = await msg.guild.members.fetch({member: userIdsToFetch, withPresences:false, cache: false});// #discordapi
        for (fetchedMember of fetchedMembers) {
          fetchedMember = fetchedMember[1];
          for (memberRank of memberRanks)
            if (fetchedMember.id == memberRank.userId)
              memberRank.name = fetchedMember.user.username;
        }
      }

      resolve();
    } catch (e) { console.log(e); }
  });
}
