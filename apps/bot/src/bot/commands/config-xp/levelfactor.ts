import { command } from '#bot/commands.ts';
import { resetGuildCache } from '#bot/models/resetModel.ts';
import { getGuildModel } from '../../models/guild/guildModel.ts';

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
