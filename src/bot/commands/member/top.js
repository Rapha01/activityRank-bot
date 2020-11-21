const guildMemberModel = require('../../models/guild/guildMemberModel.js');
const rankModel = require('../../models/rankModel.js');
const fct = require('../../../util/fct.js');
const cooldownUtil = require('../../util/cooldownUtil.js');
const nameUtil = require('../../util/nameUtil.js');
const errorMsgs = require('../../../const/errorMsgs.js');
const Discord = require('discord.js');

module.exports = (msg,targetUserId,args) => {
  return new Promise(async function (resolve, reject) {
    try {

      await guildMemberModel.cache.load(msg.member);

      args = args.map(t => t.toLowerCase());
      const page = fct.extractPage(args,msg.guild.appData.entriesPerPage);
      const time = fct.extractTime(args);

      if (page.number < 1 || page.number > 100) {
        await msg.channel.send('Pagenumber needs to be within 1 and 100.');
        return resolve();
      }

      if (!await cooldownUtil.checkStatCommandsCooldown(msg)) return resolve();

      if (!targetUserId)
        targetUserId = msg.author.id;

      // Check type
      if (args.indexOf('channels') > -1)
        await sendChannelsEmbed(msg,targetUserId,args,time,page.from,page.to);
      else {
        await msg.channel.send('You need to define which toplist to show: channels text or channels voice.');
        return resolve();
      }

    } catch (e) { reject(e); }
    resolve();
  });
}

function sendChannelsEmbed(msg,targetUserId,args,time,from,to) {
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

      const guildMemberTopChannels = await rankModel.getGuildMemberTopChannels(msg.guild,targetUserId,type,time,from,to);

      if (!guildMemberTopChannels || guildMemberTopChannels.length == 0) {
        await msg.channel.send('No entries found for this page.');
        return resolve();
      }

      let embed = new Discord.MessageEmbed()
          .setTitle(header)
          .setAuthor('')
          .setColor('#4fd6c8')
          .setFooter(msg.client.appData.settings.footer);

      let str = '';
      for (let i = 0; i < guildMemberTopChannels.length;i++) {
        if (type == 'voiceMinute')
          str = ':microphone2: ' + (Math.round(guildMemberTopChannels[i][time] / 60 * 10) / 10);
        else if (type == 'textMessage')
          str = ':writing_hand: ' + guildMemberTopChannels[i][time];

        embed.addField('#' + (from + i) + '  ' + nameUtil.getChannelName(msg.guild.channels.cache,guildMemberTopChannels[i].channelId), str);
      }

      await msg.channel.send(embed);
    } catch (e) { reject(e); }
    resolve();
  });
}
