import { PermissionFlagsBits } from 'discord.js';
import { getGuildModel } from '../../models/guild/guildModel.js';
import resetModel from '../../models/resetModel.js';
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
    const levelFactor = interaction.options.getInteger('levelfactor', true);
    const cachedGuild = await getGuildModel(interaction.guild);
    await cachedGuild.upsert({ levelFactor });

    resetModel.cache.resetGuildMembersAll(interaction.guild);

    await interaction.reply({
      content: `Your levelfactor is now set to \`${levelFactor}\``,
      ephemeral: true,
    });
  },
});
