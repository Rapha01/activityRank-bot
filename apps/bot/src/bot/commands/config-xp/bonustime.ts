import { ApplicationCommandOptionType, PermissionFlagsBits } from 'discord.js';
import { getGuildModel } from '../../models/guild/guildModel.js';
import { subcommand } from '#bot/util/registry/command.js';

export const bonustime = subcommand({
  data: {
    name: 'bonustime',
    description: 'Start bonustime for a specified duration.',
    type: ApplicationCommandOptionType.Subcommand,
    options: [
      {
        name: 'time',
        description: 'The time for the bonustime to last, in minutes',
        type: ApplicationCommandOptionType.Integer,
        required: true,
        autocomplete: true,
        min_value: 0,
        max_value: 60 * 24 * 14,
      },
    ],
  },
  async execute({ interaction }) {
    if (
      interaction.channel &&
      !interaction.member.permissionsIn(interaction.channel).has(PermissionFlagsBits.ManageGuild)
    ) {
      await interaction.reply({
        content: 'You need the permission to manage the server in order to use this command.',
        ephemeral: true,
      });
      return;
    }
    const cachedGuild = await getGuildModel(interaction.guild);

    const bonusUntilDate = Math.floor(
      Date.now() / 1000 + interaction.options.getInteger('time', true) * 60,
    );
    await cachedGuild.upsert({ bonusUntilDate: bonusUntilDate.toString() });

    if (bonusUntilDate <= Date.now() / 1000) {
      await interaction.reply({ content: 'Ended bonus time.' });
      return;
    }

    await interaction.reply({
      content: `Bonus time has started! It will end <t:${bonusUntilDate}:R>.`,
    });
  },
  autocomplete: {
    async time({ interaction }) {
      await interaction.respond([
        { name: 'End Now', value: 0 },
        { name: '1 hour', value: 60 },
        { name: '3 hours', value: 60 * 3 },
        { name: '12 hours', value: 60 * 12 },
        { name: '1 day', value: 60 * 24 },
        { name: '3 days', value: 60 * 24 * 3 },
        { name: '1 week', value: 60 * 24 * 7 },
        { name: '2 weeks', value: 60 * 24 * 14 },
      ]);
    },
  },
});
