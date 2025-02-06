import { ApplicationCommandOptionType, PermissionFlagsBits } from 'discord.js';
import { stripIndent } from 'common-tags';
import { getGuildModel } from '../../models/guild/guildModel.js';
import { parseEmojiString } from '#bot/util/emoji.js';
import { command } from '#bot/commands.js';

export default command({
  name: 'config-server vote',
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

    const items = {
      voteEmote: (options.emote && parseEmojiString(options.emote)) ?? undefined,
      voteTag: options.tag,
    };

    if (Object.values(items).every((x) => x === undefined)) {
      await interaction.reply({
        content: 'You must specify at least one option for this command to do anything!',
        ephemeral: true,
      });
      return;
    }

    const cachedGuild = await getGuildModel(interaction.guild);
    await cachedGuild.upsert(items);

    await interaction.reply({
      embeds: [
        {
          author: { name: 'Vote Tag/Emote' },
          color: 0x00ae86,
          description: stripIndent`
            Modified the server's settings!
      
            Vote Tag: \`${cachedGuild.db.voteTag}\`
            Vote Emote: ${cachedGuild.db.voteEmote}
            `,
        },
      ],
      ephemeral: true,
    });
  },
});
