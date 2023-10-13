import { PermissionFlagsBits } from 'discord.js';
import guildModel from '../../models/guild/guildModel.js';
import resetModel from '../../models/resetModel.js';
import { registerSubCommand } from 'bot/util/commandLoader.js';

registerSubCommand({
  async execute(interaction) {
    if (
      !interaction.member.permissionsIn(interaction.channel!).has(PermissionFlagsBits.ManageGuild)
    ) {
      return await interaction.reply({
        content: 'You need the permission to manage the server in order to use this command.',
        ephemeral: true,
      });
    }

    await guildModel.storage.set(
      interaction.guild,
      'levelFactor',
      interaction.options.getInteger('levelfactor', true),
    );

    resetModel.cache.resetGuildMembersAll(interaction.guild);

    await interaction.reply({
      content: `Your levelfactor is now set to \`${interaction.options.getInteger(
        'levelfactor',
        true,
      )}\``,
      ephemeral: true,
    });
  },
});
