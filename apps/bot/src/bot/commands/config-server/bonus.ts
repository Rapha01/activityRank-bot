import { PermissionFlagsBits } from 'discord.js';
import { getGuildModel } from '../../models/guild/guildModel.js';
import { parseEmojiString } from '#bot/util/emoji.js';
import { command } from '#bot/commands.js';

export default command({
  name: 'config-server bonus',
  async execute({ interaction, options, t }) {
    if (
      interaction.channel &&
      !interaction.member.permissionsIn(interaction.channel).has(PermissionFlagsBits.ManageGuild)
    ) {
      await interaction.reply({ content: t('missing.manageServer'), ephemeral: true });
      return;
    }

    const rawBonusEmote = options.emote;
    const items = {
      bonusEmote: (rawBonusEmote && parseEmojiString(rawBonusEmote)) ?? undefined,
      bonusTag: options.tag,
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
          author: { name: t('config-server.bonusTitle') },
          color: 0x00ae86,
          description: t('config-server.modifiedBonus', cachedGuild.db),
        },
      ],
      ephemeral: true,
    });
  },
});
