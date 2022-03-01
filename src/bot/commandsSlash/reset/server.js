const cooldownUtil = require('../../util/cooldownUtil.js');
const resetModel = require('../../models/resetModel.js');

module.exports.execute = async (i) => {
  if (!i.member.permissionsIn(i.channel).has('MANAGE_GUILD')) {
    return await i.reply({
      content: 'You need the permission to manage the server in order to use this command.',
      ephemeral: true,
    });
  }

  if (!await cooldownUtil.checkResetServerCommandCooldown(i)) return;

  const field = i.options.getString('type');
  if (field == 'stop') {
    delete resetModel.resetJobs[i.guild.id];

    await i.reply({
      content: 'Stopped reset.',
      ephemeral: true,
    });
  } else if (field == 'deletedmembers') {
    const userIds = await resetModel.storage.getDeletedUserIds(i.guild);

    resetModel.resetJobs[i.guild.id] = { type: 'guildMembersStats', ref: i, cmdChannel: i.channel, userIds: userIds };
    await i.reply({
      content: 'Resetting, please wait...',
      ephemeral: true,
    });
  } else if (field == 'deletedchannels') {
    const channelIds = await resetModel.storage.getDeletedChannelIds(i.guild);

    resetModel.resetJobs[i.guild.id] = { type: 'guildChannelsStats', ref: i, cmdChannel: i.channel, channelIds: channelIds };
    await i.reply({
      content: 'Resetting, please wait...',
      ephemeral: true,
    });
  } else if (
    field == 'all'
    || field == 'stats'
    || field == 'settings'
    || field == 'textstats'
    || field == 'voicestats'
    || field == 'invitestats'
    || field == 'votestats'
    || field == 'bonusstats'
  ) {
    resetModel.resetJobs[i.guild.id] = { type: field, cmdChannel: i.channel };
    await i.reply({
      content: 'Resetting, please wait...',
      ephemeral: true,
    });
  }
  i.guild.appData.lastResetServer = Date.now() / 1000;
};