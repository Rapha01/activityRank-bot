import { ApplicationCommandOptionType, PermissionFlagsBits } from 'discord.js';
import { command } from '#bot/commands.js';
import { resetGuildCache } from '#bot/models/resetModel.js';
import { getGuildModel } from '../../models/guild/guildModel.js';

export default command({
  name: 'config-xp levelfactor',
  async execute({ interaction, options, t }) {
    const cachedGuild = await getGuildModel(interaction.guild);
    await cachedGuild.upsert({ levelFactor: options.levelfactor });

    resetGuildCache(interaction.guild).allMembers();

    await interaction.reply({
      content: t('config-xp.levelfactor', { levelfactor: options.levelfactor }),
      ephemeral: true,
    });
  },
});
