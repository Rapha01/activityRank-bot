import { PermissionFlagsBits } from 'discord.js';
import { command } from '#bot/commands.ts';
import { parseEmojiString } from '#bot/util/emoji.ts';
import { getGuildModel } from '../../models/guild/guildModel.ts';

export default command({
  name: 'config-server vote',
  async execute({ interaction, options, t }) {
    if (
      interaction.channel &&
      !interaction.member.permissionsIn(interaction.channel).has(PermissionFlagsBits.ManageGuild)
    ) {
      await interaction.reply({ content: t('missing.manageServer'), ephemeral: true });
      return;
    }

    const items = {
      voteEmote: (options.emote && parseEmojiString(options.emote)) ?? undefined,
      voteTag: options.tag,
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
          author: { name: t('config-server.voteTitle') },
          color: 0x01c3d9,
          description: t('config-server.modifiedVote', cachedGuild.db),
        },
      ],
      ephemeral: true,
    });
  },
});
