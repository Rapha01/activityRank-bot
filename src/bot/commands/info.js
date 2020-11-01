const Discord = require('discord.js');
const guildModel = require('../models/guild/guildModel.js');
const guildChannelModel = require('../models/guild/guildChannelModel.js');
const guildRoleModel = require('../models/guild/guildRoleModel.js');
const fct = require('../../util/fct.js');
const errorMsgs = require('../../const/errorMsgs.js');

module.exports = (msg,args) => {
  return new Promise(async function (resolve, reject) {
    try {
      const myGuild = await guildModel.storage.get(msg.guild);
      const page = fct.extractPage(args,myGuild.entriesPerPage);

      let subcommand;
      if (args.length != 0)
        subcommand = args[0].toLowerCase();

      if (args.length == 0)
        await info(msg,myGuild);
      else if (subcommand == 'levels' || subcommand == 'level')
        await levels(msg,myGuild,page.from,page.to);
      else if (subcommand == 'roles' || subcommand == 'role')
        await roles(msg,myGuild,page.from,page.to);
      else if (subcommand == 'nocommandchannels' || subcommand == 'nocommandchannel')
        await noCommandChannels(msg,myGuild,page.from,page.to);
      else if (subcommand == 'noxpchannels' || subcommand == 'noxpchannel')
        await noXpChannels(msg,myGuild,page.from,page.to);
      else if (subcommand == 'noxproles' || subcommand == 'noxprole')
        await noXpRoles(msg,myGuild,page.from,page.to);
      else if (subcommand == 'messages')
        await messages(msg,myGuild,page.from,page.to);
      else {
        await msg.channel.send(errorMsgs.invalidSubcommand.replace('<prefix>',msg.guild.appData.prefix));
        return resolve();
      }
    } catch (e) { reject(e); }
    resolve();
  });
}

function info(msg,myGuild) {
  return new Promise(async function (resolve, reject) {
    try {
      const embed = new Discord.MessageEmbed()
          .setTitle('')
          .setAuthor('Info for server ' + msg.guild.name, '')
          .setColor('#4fd6c8')
          .setThumbnail(msg.guild.iconURL)
          .setFooter(msg.client.appData.settings.footer)

      embed.addField('**General**',
          'Tracking since: ' + new Date(myGuild.addDate * 1000).toLocaleString().substr(0,9) + '.\n' +
          'Notify levelup direct message: ' + (myGuild.notifyLevelupDm ? 'Yes' : 'No') + '.\n' +
          'Notify levelup specific channel: ' + (myGuild.autopost_levelup ? '#' + fct.getChannelName(msg.guild.channels.cache,myGuild.autopost_levelup) : 'No') + '.\n' +
          'Notify levelup current channel: ' + (myGuild.notifyLevelupCurrentChannel ? 'Yes' : 'No') + '.\n' +
          'Notify levelup (dm and channel) with new roles: ' + (myGuild.notifyLevelupOnlyWithRole ? 'Yes' : 'No') + '.\n'+
          'Take away assigned roles on leveldown: ' + (myGuild.takeAwayAssignedRolesOnLevelDown ? 'Yes' : 'No') + '.\n'+
          'List entries per page: ' + myGuild.entriesPerPage + '.\n' +
          'Status: ' + (fct.isPremiumGuild(msg.guild) ? 'Premium' : 'Not Premium') + '.\n');
      embed.addField('**Tokens**',
          'Available: ' + msg.guild.appData.tokens + ' (burning ' + Math.floor(fct.getTokensToBurn24h(msg.guild.memberCount)) + ' / 24h).\n' +
          'Burned: ' + myGuild.tokensBurned + '.\n');

      let bonusTimeString = '';

      if (myGuild.bonusUntilDate > Date.now() / 1000)
        bonusTimeString = '**!! Bonus XP Active !!** (' +
            (Math.round(((myGuild.bonusUntilDate - Date.now() / 1000)/60/60)*10)/10)+'h left)\n' +
            myGuild.bonusPerTextMessage*myGuild.xpPerBonus + ' Bonus XP per textmessage.\n' +
            myGuild.bonusPerVoiceMinute*myGuild.xpPerBonus + ' Bonus XP per voiceminute.\n' +
            myGuild.bonusPerVote*myGuild.xpPerBonus + ' Bonus XP for ' + myGuild.voteTag + '.\n' ;

      const textmessageCooldownString = myGuild.textMessageCooldownSeconds ? 'max every ' + myGuild.textMessageCooldownSeconds + ' seconds' : ' without any cooldown';
      embed.addField('**Points** ',
          'Votecooldown: A user has to wait ' + Math.round(myGuild.voteCooldownSeconds / 60) + ' minutes between each vote.\n' +
          'Textmessagecooldown: Messages give XP ' + textmessageCooldownString + '.\n' +
          'Muted voice XP allowed: ' + (myGuild.allowMutedXp ? 'Yes' : 'No') + '.\n' +
          'Solo XP allowed: ' + (myGuild.allowSoloXp ? 'Yes' : 'No') + '\n' +
          'Deafened XP allowed: ' + (myGuild.allowDeafenedXp ? 'Yes' : 'No') + '\n' +
          'Invisible XP allowed: ' + (myGuild.allowInvisibleXp ? 'Yes' : 'No') + '\n' +
          'Levelfactor: ' + myGuild.levelFactor + ' XP.\n' +
          myGuild.xpPerTextMessage + ' XP per textmessage.\n' +
          myGuild.xpPerVoiceMinute + ' XP per voiceminute.\n' +
          myGuild.xpPerVote + ' XP for ' + myGuild.voteTag + '.\n' +
          bonusTimeString
          );

      embed.addField('Roles','Please check ``' + myGuild.prefix + 'info roles``.',true);
      embed.addField('Levels','Please check ``' + myGuild.prefix + 'info levels``.',true);
      embed.addField('NoXP channels','Please check ``' + myGuild.prefix + 'info noXpchannels``.');
      embed.addField('NoXP roles','Please check ``' + myGuild.prefix + 'info noXpRoles``.',true);
      embed.addField('NoCommand channels','Please check ``' + myGuild.prefix + 'info noCommandChannels``.',true);

      await msg.channel.send(embed);
      resolve();
    } catch (e) { reject(e); }
  });
}

function levels(msg,myGuild,from,to) {
  return new Promise(async function (resolve, reject) {
    try {
      console.log(from,to);
      const embed = new Discord.MessageEmbed()
          .setTitle('')
          .setAuthor('Levels info from ' + (from+1) + ' to ' + (to+1), '')
          .setColor('#4fd6c8')
          .setDescription('XP needed to reach next level (total XP).\nLevelfactor: ' + myGuild.levelFactor + '.')
          .setFooter(msg.client.appData.settings.footer)

      let levels = [],localXp = 100,totalXp = 0;
      for (let i = 2; i < to + 2; i++) {
        localXp = 100 + (i-1)*myGuild.levelFactor;
        totalXp += localXp;
        levels.push({nr:i,totalXp:totalXp,localXp:localXp});
      }

      levels = levels.slice(from-1,to);

      for (level of levels)
        embed.addField(':military_medal:' + level.nr,level.localXp + ' (' + level.totalXp + ')',true);

      await msg.channel.send(embed);
      resolve();
    } catch (e) { reject(e); }
  });
}

function roles(msg,myGuild,from,to) {
  return new Promise(async function (resolve, reject) {
    try {
      const embed = new Discord.MessageEmbed()
          .setTitle('')
          .setAuthor('Roles info', '')
          .setDescription('This servers activity roles and their respective levels.')
          .setColor('#4fd6c8')
          .setFooter(msg.client.appData.settings.footer)

      let roleAssignments = await guildRoleModel.storage.getRoleAssignments(msg.guild);
      roleAssignments = roleAssignments.slice(from-1,to);

      let role;
      for (myRole of roleAssignments) {
        role = msg.guild.roles.cache.get(myRole.roleId);
        embed.addField(fct.getRoleName(msg.guild.roles.cache,myRole.roleId),getlevelString(myRole),true);
      }

      if (roleAssignments.length == 0)
        embed.setDescription('No roles to show here.');

      await msg.channel.send(embed);
      resolve();
    } catch (e) { reject(e); }
  });
}

function getlevelString(myRole) {
  if (myRole.assignLevel != 0 && myRole.deassignLevel != 0)
    return 'From ' + myRole.assignLevel + ' to ' + myRole.deassignLevel;
  else if (myRole.assignLevel != 0)
    return 'From ' + myRole.assignLevel;
  else if (myRole.deassignLevel != 0)
    return 'Until ' + myRole.deassignLevel;
}

function noXpRoles(msg,myGuild,from,to) {
  return new Promise(async function (resolve, reject) {
    try {
      const embed = new Discord.MessageEmbed()
          .setTitle('')
          .setAuthor('NoXP roles info', '')
          .setColor('#4fd6c8')
          .setDescription('Activity from users with these roles will not give xp.')
          .setFooter(msg.client.appData.settings.footer);

      let noXpRoleIds = await guildRoleModel.getNoXpRoleIds(msg.guild);
      noXpRoleIds = noXpRoleIds.slice(from-1,to);

      let role;
      for (roleId of noXpRoleIds)
        embed.addField(':no_entry_sign:',fct.getRoleName(msg.guild.roles.cache,roleId),true);

      if (noXpRoleIds.length == 0)
        embed.setDescription('No roles to show here.');

      await msg.channel.send(embed);
      resolve();
    } catch (e) { reject(e); }
  });
}

function noXpChannels(msg,myGuild,from,to) {
  return new Promise(async function (resolve, reject) {
    try {
      const embed = new Discord.MessageEmbed()
          .setTitle('')
          .setAuthor('NoXP channels info', '')
          .setColor('#4fd6c8')
          .setDescription('Activity in these channels will not give xp.')
          .setFooter(msg.client.appData.settings.footer)

      let noXpChannelIds = await guildChannelModel.getNoXpChannelIds(msg.guild);
      noXpChannelIds = noXpChannelIds.slice(from-1,to);

      let channel;
      for (channelId of noXpChannelIds)
        embed.addField(fct.getChannelTypeIcon(msg.guild.channels.cache,channelId),fct.getChannelName(msg.guild.channels.cache,channelId),true);

      if (noXpChannelIds.length == 0)
        embed.setDescription('No channels to show here.');

      await msg.channel.send(embed);
      resolve();
    } catch (e) { reject(e); }
  });
}

function noCommandChannels(msg,myGuild,from,to) {
  return new Promise(async function (resolve, reject) {
    try {
      let description = '';
      if (msg.guild.appData.commandOnlyChannel != 0)
        description += ':warning: The commandOnly channel is set. The bot will respond only in channel ' + fct.getChannelName(msg.guild.channels.cache,msg.guild.appData.commandOnlyChannel) + '. \n \n';

      description += 'NoCommand channels (does not affect users with manage server permission): \n';
      const embed = new Discord.MessageEmbed()
          .setTitle('')
          .setAuthor('NoCommand channels info', '')
          .setColor('#4fd6c8')
          .setFooter(msg.client.appData.settings.footer)

      let noCommandChannelIds = await guildChannelModel.getNoCommandChannelIds(msg.guild);
      noCommandChannelIds = noCommandChannelIds.slice(from-1,to);

      let channel;
      for (channelId of noCommandChannelIds)
        embed.addField(fct.getChannelTypeIcon(msg.guild.channels.cache,channelId),fct.getChannelName(msg.guild.channels.cache,channelId),true);

      if (noCommandChannelIds.length == 0)
        description += 'No channels to show here.','Use *' + msg.guild.appData.prefix + 'channel noCommand* to add some';

      embed.setDescription(description);

      await msg.channel.send(embed);
      resolve();
    } catch (e) { reject(e); }
  });
}
