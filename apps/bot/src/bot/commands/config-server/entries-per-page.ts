import { PermissionFlagsBits } from 'discord.js';
import { command } from '#bot/commands.js';
import { getGuildModel } from '../../models/guild/guildModel.js';

export default command({
  name: 'config-server entries-per-page',
  async execute({ interaction, options, t }) {
    if (
      !interaction.channel ||
      !interaction.member.permissionsIn(interaction.channel).has(PermissionFlagsBits.ManageGuild)
    ) {
      await interaction.reply({ content: t('missing.manageServer'), ephemeral: true });
      return;
    }

    const guildModel = await getGuildModel(interaction.guild);
    await guildModel.upsert({ entriesPerPage: options.value });

    await interaction.reply({
      content: t('config-server.entriesPerPage', { entriesPerPage: options.value }),
      ephemeral: true,
    });
  },
});
