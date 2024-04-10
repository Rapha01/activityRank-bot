import { PermissionFlagsBits } from 'discord.js';
import { getGuildModel } from '../../models/guild/guildModel.js';
import { registerSubCommand } from 'bot/util/commandLoader.js';

registerSubCommand({
  async execute(i) {
    if (!i.member.permissionsIn(i.channel!).has(PermissionFlagsBits.ManageGuild)) {
      return await i.reply({
        content: 'You need the permission to manage the server in order to use this command.',
        ephemeral: true,
      });
    }
    const cachedGuild = await getGuildModel(i.guild);

    const bonusUntilDate = Math.floor(Date.now() / 1000 + i.options.getInteger('time', true) * 60);
    await cachedGuild.upsert({ bonusUntilDate });
    await i.reply({ content: `Bonus time has started! It will end <t:${bonusUntilDate}:R>.` });
  },
  async executeAutocomplete(interaction) {
    await interaction.respond([
      { name: 'End Now', value: 0 },
      { name: '1 hour', value: 60 },
      { name: '3 hours', value: 60 * 3 },
      { name: '12 hours', value: 60 * 12 },
      { name: '1 day', value: 60 * 24 },
      { name: '2 days', value: 60 * 24 * 2 },
      { name: '3 days', value: 60 * 24 * 3 },
    ]);
  },
});
