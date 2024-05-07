import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { stripIndent } from 'common-tags';
import { getGuildModel } from '../../models/guild/guildModel.js';
import { registerSubCommand } from 'bot/util/commandLoader.js';
import { parseEmojiString } from 'bot/util/emoji.js';

registerSubCommand({
  async execute(interaction) {
    if (
      !interaction.member.permissionsIn(interaction.channel!).has(PermissionFlagsBits.ManageGuild)
    ) {
      return await interaction.reply({
        content: 'You need the permission to manage the server in order to use this command.',
        ephemeral: true,
      });
    }

    const rawVoteEmote = interaction.options.getString('emote');
    const items = {
      voteEmote: (rawVoteEmote && parseEmojiString(rawVoteEmote)) ?? undefined,
      voteTag: interaction.options.getString('tag') ?? undefined,
    };

    if (Object.values(items).every((x) => x === undefined)) {
      return await interaction.reply({
        content: 'You must specify at least one option for this command to do anything!',
        ephemeral: true,
      });
    }

    const cachedGuild = await getGuildModel(interaction.guild);
    await cachedGuild.upsert(items);

    await interaction.reply({
      embeds: [
        new EmbedBuilder().setAuthor({ name: 'Vote Tag/Emote' }).setColor(0x00ae86)
          .setDescription(stripIndent`
        Modified the server's settings!

        Vote Tag: \`${cachedGuild.db.voteTag}\`
        Vote Emote: ${cachedGuild.db.voteEmote}
        `),
      ],
      ephemeral: true,
    });
  },
});
