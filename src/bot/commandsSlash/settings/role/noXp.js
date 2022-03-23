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
  const targetRoleId = i.options.getRole('role').id;
  const myRole = await guildRoleModel.storage.get(i.guild, targetRoleId);

  if (myRole.noXp) {
    await guildRoleModel.storage.set(i.guild, targetRoleId, 'noXp', 0);
    await i.reply({
      content: 'Users with the specified role are no longer banned from gaining XP.',
      ephemeral: true,
    });
  } else {
    await guildRoleModel.storage.set(i.guild, targetRoleId, 'noXp', 1);
    await i.reply({
      content: 'Users with the specified role are now banned from gaining XP.',
      ephemeral: true,
    });
  }
};