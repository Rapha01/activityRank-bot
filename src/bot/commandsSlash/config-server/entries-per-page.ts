import { PermissionFlagsBits } from 'discord.js';
import guildModel from '../../models/guild/guildModel.js';
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
      'entriesPerPage',
      interaction.options.getInteger('value', true),
    );

    await interaction.reply({
      content: `The server will now see \`${interaction.options.getInteger(
        'value',
      )}\` entries per page.`,
      ephemeral: true,
    });
  },
});
