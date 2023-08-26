// GENERATED: this file has been altered by `relative-named-imports`.
// [GENERATED: relative-named-imports:v0]

import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { commaListsAnd } from 'common-tags';
import guildRoleModel from '../../models/guild/guildRoleModel.js';
import nameUtil from '../../util/nameUtil.js';
// GENERATED: added extension to relative import
// import { parseRole } from '../../util/parser';
import { parseRole } from '../../util/parser.js';

export const execute = async function (i) {
  if (!i.member.permissionsIn(i.channel).has(PermissionFlagsBits.ManageGuild)) {
    return await i.reply({
      content:
        'You need the permission to manage the server in order to use this command.',
      ephemeral: true,
    });
  }

  const resolvedRole = await parseRole(i);

  if (!resolvedRole) {
    return await i.reply({
      content: "You need to specify either a role or a role's ID!",
      ephemeral: true,
    });
  }

  if (!i.member.permissionsIn(i.channel).has(PermissionFlagsBits.ManageRoles)) {
    return await i.reply({
      content:
        'Please ensure the bot has the permission to manage roles for the duration of this setup.',
      ephemeral: true,
    });
  }

  const items = {
    assignLevel: i.options.getInteger('assign-level'),
    deassignLevel: i.options.getInteger('deassign-level'),
  };
  if (Object.values(items).every((x) => x === null)) {
    return await i.reply({
      content:
        'You must specify at least one option for this command to do anything!',
      ephemeral: true,
    });
  }

  for (const k in items) {
    const roleAssignmentsByLevel =
      await guildRoleModel.storage.getRoleAssignmentsByLevel(
        i.guild,
        k,
        items[k]
      );
    if (items[k] !== 0 && roleAssignmentsByLevel.length >= 3) {
      return await i.reply({
        content:
          'There is a maximum of 3 roles that can be assigned or deassigned from each level. Please remove some first.',
        ephemeral: true,
      });
    }
    if (items[k] !== null)
      await guildRoleModel.storage.set(i.guild, resolvedRole.id, k, items[k]);
  }
  const x = await guildRoleModel.storage.getRoleAssignmentsByRole(
    i.guild,
    resolvedRole.id
  );
  const e = new EmbedBuilder()
    .setAuthor({ name: 'Assign/Deassignments for this role' })
    .setColor(0x00ae86)
    .setDescription(
      nameUtil.getRoleMention(i.guild.roles.cache, resolvedRole.id)
    );

  const roleAssignLevels = x.map((o) =>
    o.assignLevel != 0 ? `\`${o.assignLevel}\`` : null
  );
  const roleDeassignLevels = x.map((o) =>
    o.deassignLevel != 0 ? `\`${o.deassignLevel}\`` : null
  );
  if (!roleAssignLevels.every((o) => o === null))
    e.addFields({
      name: 'Assignment Levels',
      value: commaListsAnd(roleAssignLevels),
    });
  if (!roleDeassignLevels.every((o) => o === null))
    e.addFields({
      name: 'Deassignment Levels',
      value: commaListsAnd(roleDeassignLevels),
    });

  await i.reply({
    embeds: [e],
    ephemeral: true,
  });
};


// GENERATED: start of generated content by `exports-to-default`.
// [GENERATED: exports-to-default:v0]

export default {
    execute,
}

// GENERATED: end of generated content by `exports-to-default`.

