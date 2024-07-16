import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { commaListsAnd } from 'common-tags';
import guildRoleModel from '../../models/guild/guildRoleModel.js';
import nameUtil from '../../util/nameUtil.js';
import { ParserResponseStatus, parseRole } from '../../util/parser.js';
import { registerSubCommand } from 'bot/util/commandLoader.js';

registerSubCommand({
  async execute(interaction) {
    if (!interaction.channel) throw new Error();

    if (
      !interaction.member.permissionsIn(interaction.channel).has(PermissionFlagsBits.ManageGuild)
    ) {
      return await interaction.reply({
        content: 'You need the permission to manage the server in order to use this command.',
        ephemeral: true,
      });
    }

    const resolvedRole = parseRole(interaction);
    if (resolvedRole.status === ParserResponseStatus.ConflictingInputs) {
      return await interaction.reply({
        content: `You have specified both a role and an ID, but they don't match.\nDid you mean: "/config-role levels role:${interaction.options.get('role')!.value}"?`,
        ephemeral: true,
      });
    } else if (resolvedRole.status === ParserResponseStatus.NoInput) {
      return await interaction.reply({
        content: "You need to specify either a role or a role's ID!",
        ephemeral: true,
      });
    }

    if (
      !interaction.member.permissionsIn(interaction.channel).has(PermissionFlagsBits.ManageRoles)
    ) {
      return await interaction.reply({
        content:
          'Please ensure the bot has the permission to manage roles for the duration of this setup.',
        ephemeral: true,
      });
    }

    const items = {
      assignLevel: interaction.options.getInteger('assign-level'),
      deassignLevel: interaction.options.getInteger('deassign-level'),
    };

    if (items.assignLevel && items.deassignLevel && items.assignLevel >= items.deassignLevel) {
      return await interaction.reply({
        content: `Using an assignLevel higher than or equal to a deassignLevel will not work: the role gets removed as soon as it gets added!\nDid you mean: \`assign-level:${items.deassignLevel} deassign-level:${items.assignLevel}\`?`,
        ephemeral: true,
      });
    }

    if (Object.values(items).every((x) => x === null)) {
      return await interaction.reply({
        content: 'You must specify at least one option for this command to do anything!',
        ephemeral: true,
      });
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
        return await interaction.reply({
          content:
            'There is a maximum of 3 roles that can be assigned or deassigned from each level. Please remove some first.',
          ephemeral: true,
        });
      }
      if (item !== null)
        await guildRoleModel.storage.set(interaction.guild, resolvedRole.id, k, item);
    }
    const x = await guildRoleModel.storage.getRoleAssignmentsByRole(
      interaction.guild,
      resolvedRole.id,
    );
    const e = new EmbedBuilder()
      .setAuthor({ name: 'Assign/Deassignments for this role' })
      .setColor(0x00ae86)
      .setDescription(nameUtil.getRoleMention(interaction.guild.roles.cache, resolvedRole.id));

    const roleAssignLevels = x.map((o) => (o.assignLevel != 0 ? `\`${o.assignLevel}\`` : null));
    const roleDeassignLevels = x.map((o) =>
      o.deassignLevel != 0 ? `\`${o.deassignLevel}\`` : null,
    );
    if (!roleAssignLevels.every((o) => o === null))
      e.addFields({
        name: 'Assignment Levels',
        value: commaListsAnd(`${roleAssignLevels}`),
      });
    if (!roleDeassignLevels.every((o) => o === null))
      e.addFields({
        name: 'Deassignment Levels',
        value: commaListsAnd(`${roleDeassignLevels}`),
      });

    await interaction.reply({
      embeds: [e],
      ephemeral: true,
    });
  },
});
