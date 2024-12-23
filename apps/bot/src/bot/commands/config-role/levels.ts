import { ApplicationCommandOptionType, PermissionFlagsBits, type APIEmbed } from 'discord.js';
import { commaListsAnd } from 'common-tags';
import {
  fetchRoleAssignmentsByLevel,
  fetchRoleAssignmentsByRole,
  getRoleModel,
} from 'bot/models/guild/guildRoleModel.js';
import nameUtil from '../../util/nameUtil.js';
import { subcommand } from 'bot/util/registry/command.js';

export const levels = subcommand({
  data: {
    name: 'levels',
    description: 'Set assign/deassign levels for a role.',
    options: [
      {
        name: 'role',
        description: 'The role to modify.',
        type: ApplicationCommandOptionType.Role,
        required: true,
      },
      {
        name: 'assign-level',
        description: 'The level a member must be at to gain this role.',
        type: ApplicationCommandOptionType.Integer,
        min_value: 0,
        max_value: 500,
      },
      {
        name: 'deassign-level',
        description: 'The level a member must be at to lose this role.',
        type: ApplicationCommandOptionType.Integer,
        min_value: 0,
        max_value: 500,
      },
    ],
    type: ApplicationCommandOptionType.Subcommand,
  },
  async execute({ interaction }) {
    if (
      !interaction.channel ||
      !interaction.member.permissionsIn(interaction.channel).has(PermissionFlagsBits.ManageGuild)
    ) {
      await interaction.reply({
        content: 'You need the permission to manage the server in order to use this command.',
        ephemeral: true,
      });
      return;
    }

    const resolvedRole = interaction.options.getRole('role', true);

    if (resolvedRole.id === interaction.guild.id) {
      await interaction.reply({
        content: 'You cannot make @everyone a level role.',
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
      await interaction.reply({
        content: 'Please ensure the bot has the permission to manage roles.',
        ephemeral: true,
      });
      return;
    }

    const items = {
      assignLevel: interaction.options.getInteger('assign-level'),
      deassignLevel: interaction.options.getInteger('deassign-level'),
    };

    if (items.assignLevel && items.deassignLevel && items.assignLevel >= items.deassignLevel) {
      await interaction.reply({
        content: `Using an assignLevel higher than or equal to a deassignLevel will not work: the role gets removed as soon as it gets added!\nDid you mean: \`assign-level:${items.deassignLevel} deassign-level:${items.assignLevel}\`?`,
        ephemeral: true,
      });
      return;
    }

    if (Object.values(items).every((x) => x === null)) {
      await interaction.reply({
        content: 'You must specify at least one option for this command to do anything!',
        ephemeral: true,
      });
      return;
    }

    const cachedRole = await getRoleModel(resolvedRole);

    for (const _k in items) {
      const k = _k as keyof typeof items;
      const item = items[k];
      if (item === null) continue;

      const roleAssignmentsByLevel = await fetchRoleAssignmentsByLevel(interaction.guild, k, item);
      if (item !== 0 && roleAssignmentsByLevel.length >= 3) {
        await interaction.reply({
          content:
            'There is a maximum of 3 roles that can be assigned or deassigned from each level. Please remove some first.',
          ephemeral: true,
        });
        return;
      }
      await cachedRole.upsert({ [k]: item });
    }

    const roleAssignments = await fetchRoleAssignmentsByRole(interaction.guild, resolvedRole.id);

    const embed: APIEmbed = {
      author: { name: 'Assign/Deassignments for this role' },
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
        { name: 'Assignment Levels', value: commaListsAnd(`${roleAssignLevels}`) },
      ];
    }

    if (!roleDeassignLevels.every((o) => o === null)) {
      embed.fields = [
        ...(embed.fields ?? []),
        { name: 'Deassignment Levels', value: commaListsAnd(`${roleDeassignLevels}`) },
      ];
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
});
