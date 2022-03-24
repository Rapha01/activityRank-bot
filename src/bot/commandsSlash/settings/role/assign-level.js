const { stripIndent } = require('common-tags');
const { botInviteLink } = require('../../../../const/config.js');
const guildRoleModel = require('../../../models/guild/guildRoleModel.js');


module.exports.execute = async function(i) {
  if (!i.member.permissionsIn(i.channel).has('MANAGE_GUILD')) {
    return await i.reply({
      content: 'You need the permission to manage the server, in order to use this command.',
      ephemeral: true,
    });
  }
  if (!i.guild.me.permissionsIn(i.channel).has('MANAGE_ROLES')) {
    return await i.reply({
      content: stripIndent`You have an old version of the bot with no permission to manage roles. 
      Please click [here](${botInviteLink}) to reinvite the bot. Your server's stats will ***not*** reset.`,
      ephemeral: true,
    });
  }
  const lvl = i.options.getInteger('level');
  const roleAssignmentsByLevel =
    await guildRoleModel.storage.getRoleAssignmentsByLevel(i.guild, 'assignLevel', lvl);

  if (lvl != 0 && roleAssignmentsByLevel.length >= 3) {
    return await i.reply({
      content: 'There is a maxiumum of 3 role assignments per level. Please remove some first.',
      ephemeral: true,
    });
  }

  await guildRoleModel.storage.set(i.guild, i.options.getRole('role'), 'assignLevel', lvl);

  i.reply({
    content: 'Role updated.',
    ephemeral: true,
  });
};