import { ApplicationCommandOptionType, PermissionFlagsBits, type APIEmbed } from 'discord.js';
import { commaListsAnd } from 'common-tags';
import guildRoleModel from '../../models/guild/guildRoleModel.js';
import nameUtil from '../../util/nameUtil.js';
import { ParserResponseStatus, parseRole } from '../../util/parser.js';
import { subcommand } from 'bot/util/registry/command.js';

export const levels = subcommand({
  data: {
    name: 'levels',
    description: 'Set assign/deassign levels for a role.',
    options: [
      { name: 'role', description: 'The role to modify.', type: ApplicationCommandOptionType.Role },
      {
        name: 'id',
        description: 'The ID of the role to modify.',
        type: ApplicationCommandOptionType.String,
        min_length: 17,
        max_length: 20,
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

    const resolvedRole = parseRole(interaction);
    if (resolvedRole.status === ParserResponseStatus.ConflictingInputs) {
      await interaction.reply({
        content: `You have specified both a role and an ID, but they don't match.\nDid you mean: "/config-role levels role:${interaction.options.get('role')!.value}"?`,
        ephemeral: true,
      });
      return;
    } else if (resolvedRole.status === ParserResponseStatus.NoInput) {
      await interaction.reply({
        content: "You need to specify either a role or a role's ID!",
        ephemeral: true,
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

    for (const _k in items) {
      const k = _k as keyof typeof items;
      const item = items[k];
      const roleAssignmentsByLevel = await guildRoleModel.storage.getRoleAssignmentsByLevel(
        interaction.guild,
        k,
        item,
      );
      if (item !== 0 && roleAssignmentsByLevel.length >= 3) {
        await interaction.reply({
          content:
            'There is a maximum of 3 roles that can be assigned or deassigned from each level. Please remove some first.',
          ephemeral: true,
        });
        return;
      }
      if (item !== null) {
        await guildRoleModel.storage.set(interaction.guild, resolvedRole.id, k, item);
      }
    }

    const roleAssignments = await guildRoleModel.storage.getRoleAssignmentsByRole(
      interaction.guild,
      resolvedRole.id,
    );

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
