const resetModel = require('../../models/resetModel.js');
const errorMsgs = require('../../../const/errorMsgs.js');
const cooldownUtil = require('../../util/cooldownUtil.js');

module.exports = (msg,args) => {
  return new Promise(async function (resolve, reject) {
    try {
      if (!msg.member.hasPermission("MANAGE_GUILD")) {
        await msg.channel.send('You need the permission to manage the server, in order to use this command.');
        return resolve();
      }

      if (args.length < 1) {
        await msg.channel.send(errorMsgs.tooFewArguments.replace('<prefix>',msg.guild.appData.prefix));
        return resolve();
      }

      const field = args[0].toLowerCase();
      const cd = 600;

      if (field == 'stop') {
        delete resetModel.resetJobs[msg.guild.id];

        await msg.channel.send('Stopped reset.');
      } else if (field == 'deletedmembers') {
        const toWait = cooldownUtil.getCachedCooldown(msg.guild.appData,'lastResetDeletedMembers',cd);
        if (toWait > 0) {
          await msg.channel.send('You can start the server reset of deleted members once every ' + (cd / 60) + ' minutes, please wait ' + Math.ceil(toWait / 60) + ' more minutes.');
          return resolve();
        }

        const userIds = await resetModel.storage.getDeletedUserIds(msg.guild);

        resetModel.resetJobs[msg.guild.id] = {type:'guildMembers',cmdChannel:msg.channel,userIds:userIds};
        msg.guild.appData.lastResetDeletedMembers = Date.now() / 1000;
        await msg.channel.send('Resetting, please wait...');

      } else if (field == 'deletedchannels') {
        const toWait = cooldownUtil.getCachedCooldown(msg.guild.appData,'lastResetDeletedChannels',cd);
        if (toWait > 0) {
          await msg.channel.send('You can start the reset of deleted channels only once every ' + (cd / 60) + ' minutes, please wait ' + Math.ceil(toWait / 60) + ' more minutes.');
          return resolve();
        }

        const channelIds = await resetModel.storage.getDeletedChannelIds(msg.guild);

        resetModel.resetJobs[msg.guild.id] = {type:'guildChannels',cmdChannel:msg.channel,channelIds:channelIds};
        msg.guild.appData.lastResetDeletedChannels = Date.now() / 1000;
        await msg.channel.send('Resetting, please wait...');

      } else if (field == 'all' || field == 'stats' || field == 'settings') {
        resetModel.resetJobs[msg.guild.id] = {type:field,cmdChannel:msg.channel};
        await msg.channel.send('Resetting, please wait...');
      } else {
        await msg.channel.send('Please use ``all``, ``stats``, ``settings``, ``deletedChannels``, ``deletedMembers``, or ``stop`` as subcommand to specify what to reset. F.e. ``'+msg.guild.appData.prefix+'server reset deletedChannels``.');
        resolve();
      }


      resolve();
    } catch (e) { reject(e); }
  });
}
