import { PermissionFlagsBits } from 'discord.js';
import invariant from 'tiny-invariant';
import { command } from '#bot/commands.js';
import { DANGEROUS_PERMISSIONS, DANGEROUS_PERMISSIONS_NAMES } from '#bot/levelManager.js';
import {
  fetchRoleAssignmentByRole,
  fetchRoleAssignmentsByLevel,
  getRoleModel,
} from '#bot/models/guild/guildRoleModel.js';
import nameUtil from '../../util/nameUtil.js';

export default command({
  name: 'config-role levels',
  async execute({ interaction, options, t }) {
    if (
      !interaction.channel ||
      !interaction.member.permissionsIn(interaction.channel).has(PermissionFlagsBits.ManageGuild)
    ) {
      await interaction.reply({ content: t('missing.manageServer'), ephemeral: true });
      return;
    }

    const resolvedRole = options.role;

    if (resolvedRole.id === interaction.guild.id) {
      await interaction.reply({
        content: t('config-role.everyone'),
        ephemeral: true,
        allowedMentions: { parse: [] },
      });
      return;
    }

    invariant(interaction.guild.members.me);

    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
      await interaction.reply({ content: t('config-role.manageRoles'), ephemeral: true });
      return;
    }

    const items = {
      assignLevel: options['assign-level'],
      deassignLevel: options['deassign-level'],
    } as const;

    if (items.assignLevel && items.deassignLevel && items.assignLevel >= items.deassignLevel) {
      await interaction.reply({ content: t('config-role.error1', items), ephemeral: true });
      return;
    }

    const cachedRole = await getRoleModel(resolvedRole);

    for (const _k in items) {
      const k = _k as keyof typeof items;
      const item = items[k];
      if (item === undefined) continue;

      const roleAssignmentsByLevel = await fetchRoleAssignmentsByLevel(interaction.guild, k, item);
      if (item !== 0 && roleAssignmentsByLevel.length >= 3) {
        await interaction.reply({
          content: t('config-role.maxRoles', { level: item }),
          ephemeral: true,
        });
        return;
      }
      await cachedRole.upsert({ [k]: item });
    }

    const roleAssignment = await fetchRoleAssignmentByRole(interaction.guild, resolvedRole.id);
    const roleMention = nameUtil.getRoleMention(interaction.guild.roles.cache, resolvedRole.id);

    const description = [`> ${roleMention}`];

    // does a role have dangerous permissions?
    const dangerous = resolvedRole.permissions.any(DANGEROUS_PERMISSIONS);
    // does the role have an assignLevel?
    const isAssigned = roleAssignment?.assignLevel && roleAssignment.assignLevel !== 0;
    // does the role have a deassignLevel?
    const isDeassigned = roleAssignment?.deassignLevel && roleAssignment.deassignLevel !== 0;

    if (isAssigned) {
      description.push(`* **${t('config-role.assignlevel')}**: \`${roleAssignment.assignLevel}\``);
      if (dangerous) {
        description.push('> Warning: This role has Dangerous permissions.');
      }
    }

    if (isDeassigned) {
      description.push(
        `* **${t('config-role.deassignlevel')}**: \`${roleAssignment.deassignLevel}\``,
      );
    }

    if (isAssigned && dangerous) {
      const fmt = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' });
      const list = fmt.format(DANGEROUS_PERMISSIONS_NAMES);
      description.push('### Dangerous Permissions');
      description.push(
        `As a safety measure, ActivityRank avoids assigning "dangerous" roles. Dangerous roles are those that have permissions that may cause harm to a server, such as ${list}. Please remove these permissions from ${roleMention}.`,
      );
    }

    await interaction.reply({
      embeds: [
        {
          author: { name: t('config-role.roleAdded') },
          color: 0x01c3d9,
          description: description.join('\n'),
        },
      ],
      ephemeral: true,
    });
  },
});
