const resetModel = require('../../models/resetModel.js');
const errorMsgs = require('../../../const/errorMsgs.js');
const cooldownUtil = require('../../util/cooldownUtil.js');
const cd = 600;

module.exports = (msg,args) => {
  return new Promise(async function (resolve, reject) {
    try {
      console.error(msg.member.permissionsIn(msg.channel).has("MANAGE_GUILD"))
      if (!msg.member.hasPermission("MANAGE_GUILD")) {
        await msg.channel.send('You need the permission to manage the server, in order to use this command.');
        return resolve();
      }

      if (args.length < 1) {
        await msg.channel.send(errorMsgs.tooFewArguments.replace('<prefix>',msg.guild.appData.prefix));
        return resolve();
      }

      if (!await cooldownUtil.checkResetServerCommandCooldown(msg)) return resolve();

      const field = args[0].toLowerCase();

      if (field == 'stop') {
        delete resetModel.resetJobs[msg.guild.id];

        await msg.channel.send('Stopped reset.');
      } else if (field == 'deletedmembers') {
        const userIds = await resetModel.storage.getDeletedUserIds(msg.guild);

        resetModel.resetJobs[msg.guild.id] = {type:'guildMembersStats',cmdChannel:msg.channel,userIds:userIds};
        await msg.channel.send('Resetting, please wait...');

      } else if (field == 'deletedchannels') {
        const channelIds = await resetModel.storage.getDeletedChannelIds(msg.guild);

        resetModel.resetJobs[msg.guild.id] = {type:'guildChannelsStats',cmdChannel:msg.channel,channelIds:channelIds};
        await msg.channel.send('Resetting, please wait...');

      } else if (field == 'all' || field == 'stats' || field == 'settings' || field == 'textstats' || field == 'voicestats' || field == 'invitestats' || field == 'votestats' || field == 'bonusstats') {
        resetModel.resetJobs[msg.guild.id] = {type:field,cmdChannel:msg.channel};
        await msg.channel.send('Resetting, please wait...');
      } else {
        await msg.channel.send('Please use ``all``, ``stats``, ``settings``, ``deletedChannels``, ``deletedMembers``, or ``stop`` as subcommand to specify what to reset. F.e. ``'+msg.guild.appData.prefix+'server reset deletedChannels``.');
        resolve();
      } // all, memberSettings, channelSettings, roleSettings, guildsettings, stats, textStats, voiceStats, inviteStats, voteStats, bonusStats, deletedChannels, deletedMembers

      msg.guild.appData.lastResetServer = Date.now() / 1000;

      resolve();
    } catch (e) { reject(e); }
  });
}
