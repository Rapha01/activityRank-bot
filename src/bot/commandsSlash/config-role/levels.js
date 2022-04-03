const { MessageEmbed } = require('discord.js');
const { commaListsAnd } = require('common-tags');
const guildRoleModel = require('../../models/guild/guildRoleModel.js');

module.exports.execute = async function(i) {
  if (!i.member.permissionsIn(i.channel).has('MANAGE_GUILD')) {
    return i.reply({
      content: 'You need the permission to manage the server in order to use this command.',
      ephemeral: true,
    });
  }
  if (!i.member.permissionsIn(i.channel).has('MANAGE_ROLES')) {
    return i.reply({
      content: 'Please ensure the bot has the permission to manage roles for the duration of this setup.',
      ephemeral: true,
    });
  }

  const items = {
    assignLevel: i.options.getInteger('assign-level'),
    deassignLevel: i.options.getInteger('deassign-level'),
  };
  if (Object.values(items).every(x => x === null)) {
    return i.reply({
      content: 'You must specify at least one option for this command to do anything!',
      ephemeral: true,
    });
  }

  for (const k in items) {
    const roleAssignmentsByLevel = await guildRoleModel.storage.getRoleAssignmentsByLevel(i.guild, k, items[k]);
    if (roleAssignmentsByLevel.length >= 3) {
      return i.reply({
        content: 'There is a maximum of 3 roles that can be assigned or deassigned from each level. Please remove some first.',
        ephemeral: true,
      });
    }
    if (items[k]) await guildRoleModel.storage.set(i.guild, i.options.getRole('role').id, k, items[k]);
  }
  const x = await guildRoleModel.storage.getRoleAssignmentsByRole(i.guild, i.options.getRole('role').id);
  const e = new MessageEmbed().setAuthor({ name: 'Assign/Deassignments for this role' }).setColor(0x00AE86)
    .setDescription(i.options.getRole('role').toString());
  const roleAssignLevels = x.map(o => o.assignLevel != 0 ? `\`${o.assignLevel}\`` : null);
  const roleDeassignLevels = x.map(o => o.deassignLevel != 0 ? `\`${o.deassignLevel}\`` : null);
  if (!roleAssignLevels.every(o => o === null)) e.addField('Assignment Levels', commaListsAnd(roleAssignLevels));
  if (!roleDeassignLevels.every(o => o === null)) e.addField('Deassignment Levels', commaListsAnd(roleDeassignLevels));

  i.reply({
    embeds: [e],
    ephemeral: true,
  });
};