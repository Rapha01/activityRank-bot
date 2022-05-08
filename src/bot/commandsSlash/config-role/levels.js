const { MessageEmbed } = require('discord.js');
const { commaListsAnd } = require('common-tags');
const guildRoleModel = require('../../models/guild/guildRoleModel.js');
const nameUtil = require('../../util/nameUtil.js');
const { parseRole } = require('../../util/parser');

module.exports.execute = async function(i) {
  if (!i.member.permissionsIn(i.channel).has('MANAGE_GUILD')) {
    return await i.reply({
      content: 'You need the permission to manage the server in order to use this command.',
      ephemeral: true,
    });
  }

  const resolvedRole = await parseRole(i);

  if (!resolvedRole) {
    return await i.reply({
      content: 'You need to specify either a role or a role\'s ID!',
      ephemeral: true,
    });
  }

  if (!i.member.permissionsIn(i.channel).has('MANAGE_ROLES')) {
    return await i.reply({
      content: 'Please ensure the bot has the permission to manage roles for the duration of this setup.',
      ephemeral: true,
    });
  }

  const items = {
    assignLevel: i.options.getInteger('assign-level'),
    deassignLevel: i.options.getInteger('deassign-level'),
  };
  if (Object.values(items).every(x => x === null)) {
    return await i.reply({
      content: 'You must specify at least one option for this command to do anything!',
      ephemeral: true,
    });
  }

  for (const k in items) {
    const roleAssignmentsByLevel = await guildRoleModel.storage.getRoleAssignmentsByLevel(i.guild, k, items[k]);
    if (roleAssignmentsByLevel.length >= 3) {
      return await i.reply({
        content: 'There is a maximum of 3 roles that can be assigned or deassigned from each level. Please remove some first.',
        ephemeral: true,
      });
    }
    if (items[k] !== null) await guildRoleModel.storage.set(i.guild, resolvedRole.id, k, items[k]);
  }
  const x = await guildRoleModel.storage.getRoleAssignmentsByRole(i.guild, resolvedRole.id);
  const e = new MessageEmbed().setAuthor({ name: 'Assign/Deassignments for this role' }).setColor(0x00AE86)
    .setDescription(nameUtil.getRoleMention(i.guild.roles.cache, resolvedRole.id));
  const roleAssignLevels = x.map(o => o.assignLevel != 0 ? `\`${o.assignLevel}\`` : null);
  const roleDeassignLevels = x.map(o => o.deassignLevel != 0 ? `\`${o.deassignLevel}\`` : null);
  if (!roleAssignLevels.every(o => o === null)) e.addField('Assignment Levels', commaListsAnd(roleAssignLevels));
  if (!roleDeassignLevels.every(o => o === null)) e.addField('Deassignment Levels', commaListsAnd(roleDeassignLevels));

  await i.reply({
    embeds: [e],
    ephemeral: true,
  });
};
