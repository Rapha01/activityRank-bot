import { PermissionFlagsBits } from 'discord.js';
import { getGuildModel } from '../../models/guild/guildModel.js';
import { registerSubCommand } from 'bot/util/commandLoader.js';

registerSubCommand({
  async execute(interaction) {
    if (
      !interaction.channel ||
      !interaction.member.permissionsIn(interaction.channel).has(PermissionFlagsBits.ManageGuild)
    ) {
      return await interaction.reply({
        content: 'You need the permission to manage the server in order to use this command.',
        ephemeral: true,
      });
    }

    const entriesPerPage = interaction.options.getInteger('value', true);
    const guildModel = await getGuildModel(interaction.guild);
    await guildModel.upsert({ entriesPerPage });

    await interaction.reply({
      content: `The server will now see \`${entriesPerPage}\` entries per page.`,
      ephemeral: true,
    });
  },
});
