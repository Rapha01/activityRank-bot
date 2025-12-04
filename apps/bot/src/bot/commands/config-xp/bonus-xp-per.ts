import { PermissionFlagsBits } from 'discord.js';
import { command } from '#bot/commands.ts';
import { getGuildModel } from '../../models/guild/guildModel.ts';

export default command({
  name: 'config-xp bonus-xp-per',
  async execute({ interaction, options, t }) {
    if (
      !interaction.channel ||
      !interaction.member.permissionsIn(interaction.channel).has(PermissionFlagsBits.ManageGuild)
    ) {
      await interaction.reply({ content: t('missing.manageServer'), ephemeral: true });
      return;
    }

    const items = {
      bonusPerTextMessage: options.message,
      bonusPerVoiceMinute: options.voiceminute,
      bonusPerVote: options.vote,
      bonusPerInvite: options.invite,
    };
    if (Object.values(items).every((x) => x === undefined)) {
      await interaction.reply({ content: t('missing.option'), ephemeral: true });
      return;
    }

    const cachedGuild = await getGuildModel(interaction.guild);
    cachedGuild.upsert(items);

    await interaction.reply({
      embeds: [
        {
          author: { name: t('config-xp.valueTitle') },
          color: 0x01c3d9,
          description: t('config-xp.newSettings', cachedGuild.db),
        },
      ],
      ephemeral: true,
    });
  },
});
