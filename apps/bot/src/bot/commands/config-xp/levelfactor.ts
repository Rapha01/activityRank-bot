import { ApplicationCommandOptionType, PermissionFlagsBits } from 'discord.js';
import { getGuildModel } from '../../models/guild/guildModel.js';
import { subcommand } from '#bot/util/registry/command.js';
import { resetGuildCache } from '#bot/models/resetModel.js';

export const levelfactor = subcommand({
  data: {
    name: 'levelfactor',
    description:
      "Set your server's levelfactor. The levelfactor controls how quickly levels scale in difficulty.",
    type: ApplicationCommandOptionType.Subcommand,
    options: [
      {
        name: 'levelfactor',
        description: 'The levelfactor to use in the server.',
        min_value: 20,
        max_value: 400,
        required: true,
        type: ApplicationCommandOptionType.Integer,
      },
    ],
  },
  async execute({ interaction }) {
    const levelFactor = interaction.options.getInteger('levelfactor', true);
    const cachedGuild = await getGuildModel(interaction.guild);
    await cachedGuild.upsert({ levelFactor });

    resetGuildCache(interaction.guild).allMembers();

    await interaction.reply({
      content: `Your server's levelfactor is now set to \`${levelFactor}\`.`,
      ephemeral: true,
    });
  },
});
