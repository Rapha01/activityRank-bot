import { ApplicationCommandOptionType, PermissionFlagsBits } from 'discord.js';
import { getGuildModel } from '../../models/guild/guildModel.js';
import { command } from '#bot/commands.js';
import { resetGuildCache } from '#bot/models/resetModel.js';

export default command({
  name: 'config-xp levelfactor',
  async execute({ interaction, options }) {
    const cachedGuild = await getGuildModel(interaction.guild);
    await cachedGuild.upsert({ levelFactor: options.levelfactor });

    resetGuildCache(interaction.guild).allMembers();

    await interaction.reply({
      content: `Your server's levelfactor is now set to \`${options.levelfactor}\`.`,
      ephemeral: true,
    });
  },
});
