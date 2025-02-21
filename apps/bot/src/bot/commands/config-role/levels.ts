import { PermissionFlagsBits, type APIEmbed } from 'discord.js';
import { commaListsAnd } from 'common-tags';
import {
  fetchRoleAssignmentsByLevel,
  fetchRoleAssignmentsByRole,
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
    };

    if (items.assignLevel && items.deassignLevel && items.assignLevel >= items.deassignLevel) {
      await interaction.reply({ content: t('config-role.error1', items), ephemeral: true });
      return;
    }

    if (Object.values(items).every((x) => x === undefined)) {
      await interaction.reply({ content: t('missing.option'), ephemeral: true });
      return;
    }

    const cachedRole = await getRoleModel(resolvedRole);

    for (const _k in items) {
      const k = _k as keyof typeof items;
      const item = items[k];
      if (item === undefined) continue;

      const roleAssignmentsByLevel = await fetchRoleAssignmentsByLevel(interaction.guild, k, item);
      if (item !== 0 && roleAssignmentsByLevel.length >= 3) {
        await interaction.reply({ content: t('config-role.maxRoles'), ephemeral: true });
        return;
      }
      await cachedRole.upsert({ [k]: item });
    }

    const roleAssignments = await fetchRoleAssignmentsByRole(interaction.guild, resolvedRole.id);

    const embed: APIEmbed = {
      author: { name: t('config-role.roleAdded') },
      color: 0x00ae86,
      description: nameUtil.getRoleMention(interaction.guild.roles.cache, resolvedRole.id),
    };

    const roleAssignLevels = roleAssignments
      .map((o) => (o.assignLevel !== 0 ? `\`${o.assignLevel}\`` : null))
      .filter((o) => o !== null);

    const roleDeassignLevels = roleAssignments
      .map((o) => (o.deassignLevel !== 0 ? `\`${o.deassignLevel}\`` : null))
      .filter((o) => o !== null);

    if (!roleAssignLevels.every((o) => o === null)) {
      embed.fields = [
        ...(embed.fields ?? []),
        { name: t('config-role.assignlevel'), value: commaListsAnd(`${roleAssignLevels}`) },
      ];
    }

    if (!roleDeassignLevels.every((o) => o === null)) {
      embed.fields = [
        ...(embed.fields ?? []),
        { name: t('config-role.deassignlevel'), value: commaListsAnd(`${roleDeassignLevels}`) },
      ];
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
});
