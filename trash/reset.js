const resetModel = require('../models/resetModel.js');
const guildMemberModel = require('../models/guild/guildMemberModel.js');
const guildChannelModel = require('../models/guild/guildChannelModel.js');
const emojiRegex = require('emoji-regex');
const guildModel = require('../models/guild/guildModel.js');
const fct = require('../../fct.js');
const emoteRegex = emojiRegex();
const batchsize = 5000;

module.exports = (msg,args) => {
  return new Promise(async function (resolve, reject) {
    try {
      if (!msg.member.hasPermission("MANAGE_GUILD") && msg.member.id != '370650814223482880') {
        await msg.channel.send('You need the permission to manage the server, in order to use this command.');
        return resolve();
      }

      if (args.length < 1) {
        await msg.channel.send('Too few arguments. Type ar!help reset for more information');
        return resolve();
      }

      const field = args[0];

      if (field == 'server')
        await resetServer(msg,args);
      else if (field == 'user')
        await resetGuildMember(msg,args);
      else if (field == 'channel')
        await lastResetChannel(msg,args);
      else if (field == 'deleted')
        await resetDeleted(msg,args);
      else if (field == 'stop')
        await stop(msg,args);
      else
        await msg.channel.send('Invalid argument. Type ar!help set for more information');

      resolve();
    } catch (e) { reject(e); }
  });
}

function stop(msg,args) {
  return new Promise(async function (resolve, reject) {
    try {

      delete resetModel.resetJobs[msg.guild.id];

      await msg.channel.send('Stopped reset.');
      resolve();
    } catch (e) { reject(e); }
  });
}

function resetServer(msg,args) {
  return new Promise(async function (resolve, reject) {
    try {
      // Check Command cooldown
      const cd = fct.getActionCooldown(msg.guild.appData,'lastResetGuild',120);
      if (cd > 0) {
        await msg.channel.send('You can reset server only once per hour, please wait ' + Math.ceil(cd / 60) + ' more minutes.');
        return resolve();
      }

      const opt = args[1];
      let type;
      if (opt != 'all' && opt != 'stats' && opt != 'settings') {
        await msg.channel.send('Please use ``all``, ``stats`` or ``settings`` as subcommand to specify what to reset. F.e. ``'+msg.guild.appData.prefix+'reset server settings``.');
        return resolve();
      }

      resetModel.resetJobs[msg.guild.id] = {type:opt,cmdChannel:msg.channel};

      await msg.channel.send('Resetting, please wait...');
      resolve();
    } catch (e) { reject(e); }
  });
}

function resetGuildMember(msg,args) {
  return new Promise(async function (resolve, reject) {
    try {
      // Check Command cooldown
      const cd = fct.getActionCooldown(msg.guild.appData,'lastResetGuildMember',120);
      if (cd > 0) {
        await msg.channel.send('You can reset a user only once per 2 minutes, please wait ' + Math.ceil(cd / 60) + ' more minutes.');
        return resolve();
      }

      const userName = args.slice(1,args.length+1).join(' ');

      const userId = await fct.extractUserId(msg,userName);
      if (!userId)
        return resolve();

      resetModel.resetJobs[msg.guild.id] = {type:'guildMembers',cmdChannel:msg.channel,guildId:msg.guild.id,userIds:[userId]};
      await msg.channel.send('Resetting, please wait...');


      resolve();
    } catch (e) { reject(e); }
  });
}

function resetGuildChannel(msg,args) {
  return new Promise(async function (resolve, reject) {
    try {
      // Check Command cooldown
      const cd = fct.getActionCooldown(msg.guild.appData,'lastResetChannel',120);
      if (cd > 0) {
        await msg.channel.send('You can reset a channel only once per 2 minutes, please wait ' + Math.ceil(cd / 60) + ' more minutes.');
        return resolve();
      }

      // Extract ChannelId
      let targetChannelId;
      const channelName = args.slice(1,args.length+1).join(' ');
      if (channelName.startsWith('id:'))
        targetChannelId = channelName.slice(3).trim();
      else if (msg.mentions.channels.first())
        targetChannelId = msg.mentions.channels.first().id;
      else if (channelName != '' && msg.guild.channels.cache.find(channel => channel.name == channelName))
        targetChannelId = msg.guild.channels.cache.find(channel => channel.name == channelName).id;
      else if (channelName == '') {
        await msg.channel.send('Please specify a channel.');
        return resolve();
      }

      if (!targetChannelId || isNaN(targetChannelId)) {
        await msg.channel.send('Could not find specified channel.');
        return resolve();
      }

      resetModel.resetJobs[msg.guild.id] = {type:'guildChannels',cmdChannel:msg.channel,guildId:msg.guild.id,channelIds:[targetChannelId]};
      await msg.channel.send('Resetting, please wait...');

      resolve();
    } catch (e) { reject(e); }
  });
}

function resetDeleted(msg,args) {
  return new Promise(async function (resolve, reject) {
    try {
      const cd = fct.getActionCooldown(msg.guild.appData,'lastResetDeleted',600);
      if (cd > 0) {
        await msg.channel.send('You can reset deleted users/channels only once every 10 minutes, please wait ' + Math.ceil(cd / 60) + ' more minutes.');
        return resolve();
      }

      const opt = args[1];
      if (args[1] == 'users') {
        const userIds = await getDeletedUserIds(msg.guild);
        resetModel.resetJobs[msg.guild.id] = {type:'guildMembers',cmdChannel:msg.channel,userIds:userIds};
      } else if (args[1] == 'channels') {
        const channelIds = await getDeletedChannelIds(msg.guild);
        resetModel.resetJobs[msg.guild.id] = {type:'guildChannels',cmdChannel:msg.channel,channelIds:channelIds};
      } else {
        await msg.channel.send('Please also specify what you want to reset (users or channels).');
        return resolve();
      }

      await msg.channel.send('Resetting, please wait...');
      resolve();
    } catch (e) { reject(e); }
  });
}

function getDeletedUserIds(guild) {
  return new Promise(async function (resolve, reject) {
    try {
      const userIds = await guildMemberModel.getRankedUserIds(guild);
      const users = await guild.members.fetch({cache: false, withPresences: false});

      let deletedUserIds = [],user;
      for (userId of userIds) {
        user = users.get(userId);
        if (user)
          continue;

        deletedUserIds.push(userId);
      }

      resolve(deletedUserIds);
    } catch (e) { reject(e); }
  });
}

function getDeletedChannelIds(guild) {
  return new Promise(async function (resolve, reject) {
    try {
      const channelIds = await guildChannelModel.getRankedChannelIds(guild);

      let deletedChannelIds = [],channel;
      for (channelId of channelIds) {
        channel = guild.channels.cache.get(channelId);
        if (channel)
          continue;

        deletedChannelIds.push(channelId);
      }

      resolve(deletedChannelIds);
    } catch (e) { reject(e); }
  });
}
