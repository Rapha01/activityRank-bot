import { PermissionFlagsBits } from 'discord.js';
import { command } from '#bot/commands.js';
import { getGuildModel } from '../../models/guild/guildModel.js';

export default command({
  name: 'config-xp xp-per',
  async execute({ interaction, options, t }) {
    if (
      !interaction.channel ||
      !interaction.member.permissionsIn(interaction.channel).has(PermissionFlagsBits.ManageGuild)
    ) {
      await interaction.reply({ content: t('missing.manageServer'), ephemeral: true });
      return;
    }

    const items = {
      xpPerTextMessage: options.message,
      xpPerVoiceMinute: options.voiceminute,
      xpPerVote: options.vote,
      xpPerInvite: options.invite,
    };

    if (Object.values(items).every((x) => x === undefined)) {
      await interaction.reply({ content: t('missing.option'), ephemeral: true });
      return;
    }

    const cachedGuild = await getGuildModel(interaction.guild);
    await cachedGuild.upsert(items);

    await interaction.reply({
      embeds: [
        {
          author: { name: t('config-xp.xpValues') },
          color: 0x01c3d9,
          description: t('config-xp.modifiedXPValues', cachedGuild.db),
        },
      ],
      ephemeral: true,
    });
  },
});
