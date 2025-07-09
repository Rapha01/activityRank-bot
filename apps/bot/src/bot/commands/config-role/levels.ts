import { PermissionFlagsBits, type APIEmbed } from 'discord.js';
import {
  fetchRoleAssignmentsByLevel,
  fetchRoleAssignmentByRole,
  getRoleModel,
} from '#bot/models/guild/guildRoleModel.js';
import nameUtil from '../../util/nameUtil.js';
import { command } from '#bot/commands.js';

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

    if (
      !interaction.guild.members.me ||
      !interaction.guild.members.me
        .permissionsIn(interaction.channel)
        .has(PermissionFlagsBits.ManageRoles)
    ) {
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

    const description = [
      `> ${nameUtil.getRoleMention(interaction.guild.roles.cache, resolvedRole.id)}`,
    ];

    if (roleAssignment?.assignLevel && roleAssignment.assignLevel !== 0) {
      description.push(`* **${t('config-role.assignlevel')}**: \`${roleAssignment.assignLevel}\``);
    }

    if (roleAssignment?.deassignLevel && roleAssignment.deassignLevel !== 0) {
      description.push(
        `* **${t('config-role.deassignlevel')}**: \`${roleAssignment.deassignLevel}\``,
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
