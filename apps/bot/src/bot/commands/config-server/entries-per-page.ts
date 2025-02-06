import { PermissionFlagsBits } from 'discord.js';
import { getGuildModel } from '../../models/guild/guildModel.js';
import { command } from '#bot/commands.js';

export default command({
  name: 'config-server entries-per-page',
  async execute({ interaction, options }) {
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

    const guildModel = await getGuildModel(interaction.guild);
    await guildModel.upsert({ entriesPerPage: options.value });

    await interaction.reply({
      content: `The server will now see \`${options.value}\` entries per page.`,
      ephemeral: true,
    });
  },
});
