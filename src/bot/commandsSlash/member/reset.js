const resetModel = require('../../models/resetModel.js');


module.exports.execute = async (i) => {
  const member = i.options.getMember('member');
  if (!i.member.permissionsIn(i.channel).has('MANAGE_GUILD')) {
    return await i.reply({
      content: 'You need the permission to manage the server in order to use this command.',
      ephemeral: true,
    });
  }
  resetModel.resetJobs[i.guild.id] = { type: 'guildMembersStats', cmdChannel: i.channel, userIds: member.id };
  await i.reply('Resetting, please wait...');
};