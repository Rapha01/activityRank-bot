import { PermissionFlagsBits } from 'discord.js';
import { getGuildModel } from '../../models/guild/guildModel.js';
import { command } from '#bot/commands.js';

export default command({
  name: 'config-xp bonustime',
  async execute({ interaction, options }) {
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

    const bonusUntilDate = Math.floor(Date.now() / 1000 + options.time * 60);
    await cachedGuild.upsert({ bonusUntilDate: bonusUntilDate.toString() });

    if (bonusUntilDate <= Date.now() / 1000) {
      await interaction.reply({ content: 'Ended bonus time.' });
      return;
    }

    await interaction.reply({
      content: `Bonus time has started! It will end <t:${bonusUntilDate}:R>.`,
    });
  },
  autocompletes: {
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
