const guildMemberModel = require('../../models/guild/guildMemberModel.js');
const guildModel = require('../../models/guild/guildModel.js');
const rankModel = require('../../models/rankModel.js');
const fct = require('../../../util/fct.js');
const cooldownUtil = require('../../util/cooldownUtil.js');
const nameUtil = require('../../util/nameUtil.js');
const errorMsgs = require('../../../const/errorMsgs.js');
const Discord = require('discord.js');

module.exports = (msg,args) => {
  return new Promise(async function (resolve, reject) {
    try {
      await guildMemberModel.cache.load(msg.member);
      const myGuild = await guildModel.storage.get(msg.guild);

      args = args.map(t => t.toLowerCase());
      const page = fct.extractPage(args,myGuild.entriesPerPage);
      const time = fct.extractTime(args);

      if (page.number < 1 || page.number > 100) {
        await msg.channel.send('Pagenumber needs to be within 1 and 100.');
        return resolve();
      }

      if (!await cooldownUtil.checkStatCommandsCooldown(msg)) return resolve();

      // Check type
      if (args.indexOf('channels') > -1)
        await sendChannelsEmbed(msg,args,time,page.from,page.to);
      else if (args.indexOf('members') > -1)
        await sendMembersEmbed(msg,args,myGuild,time,page.from,page.to);
      else if (args.indexOf('roles') > -1)
        await sendRolesEmbed(msg,args,myGuild,time,page.from,page.to);
      else {
        await msg.channel.send('You need to define which toplist to show: channels or members (soon also roles).');
        return resolve();
      }

    } catch (e) { reject(e); }
    resolve();
  });
}

function sendRolesEmbed(msg,args,time,from,to) {
  return new Promise(async function (resolve, reject) {
    try {
      await msg.channel.send('This command will show a toplist of roles in the future.');
      return resolve();
    } catch (e) { reject(e); }
    resolve();
  });
}

function sendChannelsEmbed(msg,args,time,from,to) {
  return new Promise(async function (resolve, reject) {
    try {
      let type,typestr;
      if (args.indexOf('voice') > -1) {
        type = 'voiceMinute';
        typestr = 'voiceChannels';
      } else if (args.indexOf('text') > -1) {
        type = 'textMessage';
        typestr = 'textChannels';
      }

      if (!type) {
        await msg.channel.send('Please specify the type ``voice`` or ``text``.');
        return resolve();
      }

      let header = 'Toplist for ' + typestr + ' from ' + from + ' to ' + to + ' | ' + time;

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

        embed.addField('#' + (from + i) + '  ' + nameUtil.getChannelName(msg.guild.channels.cache,channelRanks[i].channelId), str);
      }

      await msg.channel.send(embed);
    } catch (e) { reject(e); }
    resolve();
  });
}

function sendMembersEmbed(msg,args,myGuild,time,from,to) {
  return new Promise(async function (resolve, reject) {
    try {
      let type;
      let header = 'Toplist for server ' + msg.guild.name + ' from ' + from + ' to ' + to + ' | ' + time;

      if (args.indexOf('voice') > -1) {
        type = 'voiceMinute';
        header += ' | By voice XP';
      } else if (args.indexOf('text') > -1) {
        type = 'textMessage';
        header += ' | By text XP';
      } else if (args.indexOf(myGuild.voteTag.toLowerCase()) > -1 || args.indexOf('vote') > -1) {
        type = 'vote';
        header += ' | By ' + myGuild.voteTag;
      } else if (args.indexOf(myGuild.bonusTag.toLowerCase()) > -1 || args.indexOf('bonus') > -1) {
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

      await nameUtil.addGuildMemberNamesToRanks(msg.guild,memberRanks);

      // Embed header
      let description = '';

      if (myGuild.bonusUntilDate > Date.now() / 1000)
        description = '**!! Bonus XP Active !!** (' + (Math.round(((myGuild.bonusUntilDate - Date.now() / 1000)/60/60)*10)/10)+'h left) \n';

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
