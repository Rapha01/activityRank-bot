import { ApplicationCommandOptionType, PermissionFlagsBits } from 'discord.js';
import { getGuildModel } from '../../models/guild/guildModel.js';
import { subcommand } from 'bot/util/registry/command.js';

export const entriesPerPage = subcommand({
  data: {
    name: 'entries-per-page',
    description: 'Set the number of entries per page in embeds sent by the bot.',
    type: ApplicationCommandOptionType.Subcommand,
    options: [
      {
        name: 'value',
        description: 'The number of entries per page.',
        type: ApplicationCommandOptionType.Integer,
        min_value: 4,
        max_value: 20,
        required: true,
      },
    ],
  },
  async execute({ interaction }) {
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

    const entriesPerPage = interaction.options.getInteger('value', true);
    const guildModel = await getGuildModel(interaction.guild);
    await guildModel.upsert({ entriesPerPage });

    await interaction.reply({
      content: `The server will now see \`${entriesPerPage}\` entries per page.`,
      ephemeral: true,
    });
  },
});
