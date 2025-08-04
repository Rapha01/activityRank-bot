import { PermissionFlagsBits } from 'discord.js';
import { command } from '#bot/commands.js';
import { getGuildModel } from '../../models/guild/guildModel.js';

export default command({
  name: 'config-xp bonustime',
  async execute({ interaction, options, t }) {
    if (
      interaction.channel &&
      !interaction.member.permissionsIn(interaction.channel).has(PermissionFlagsBits.ManageGuild)
    ) {
      await interaction.reply({ content: t('missing.manageServer'), ephemeral: true });
      return;
    }
    const cachedGuild = await getGuildModel(interaction.guild);

    const bonusUntilSec = Math.floor(Date.now() / 1000 + options.time * 60);
    await cachedGuild.upsert({ bonusUntilDate: bonusUntilSec.toString() });

    if (bonusUntilSec <= Date.now() / 1000) {
      await interaction.reply({ content: t('config-xp.bonusEnd') });
      return;
    }

    await interaction.reply({
      content: t('config-xp.bonusStart', { bonusUntilSec }),
    });
  },
  autocompletes: {
    async time({ interaction, t }) {
      await interaction.respond([
        { name: t('config-xp.endNow'), value: 0 },
        { name: t('config-xp.1h'), value: 60 },
        { name: t('config-xp.3h'), value: 60 * 3 },
        { name: t('config-xp.12h'), value: 60 * 12 },
        { name: t('config-xp.1d'), value: 60 * 24 },
        { name: t('config-xp.3d'), value: 60 * 24 * 3 },
        { name: t('config-xp.1w'), value: 60 * 24 * 7 },
        { name: t('config-xp.2w'), value: 60 * 24 * 14 },
      ]);
    },
  },
});
