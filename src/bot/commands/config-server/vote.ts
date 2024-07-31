import { ApplicationCommandOptionType, PermissionFlagsBits } from 'discord.js';
import { stripIndent } from 'common-tags';
import { getGuildModel } from '../../models/guild/guildModel.js';
import { parseEmojiString } from 'bot/util/emoji.js';
import { subcommand } from 'bot/util/registry/command.js';

export const vote = subcommand({
  data: {
    name: 'vote',
    description: 'Set your voteTag and emote.',
    type: ApplicationCommandOptionType.Subcommand,
    options: [
      {
        name: 'tag',
        description: 'The voteTag to set.',
        type: ApplicationCommandOptionType.String,
      },
      {
        name: 'emote',
        description: 'The voteEmote to set.',
        type: ApplicationCommandOptionType.String,
      },
    ],
  },
  async execute({ interaction }) {
    if (
      !interaction.member.permissionsIn(interaction.channel!).has(PermissionFlagsBits.ManageGuild)
    ) {
      await interaction.reply({
        content: 'You need the permission to manage the server in order to use this command.',
        ephemeral: true,
      });
      return;
    }

    const rawVoteEmote = interaction.options.getString('emote');
    const items = {
      voteEmote: (rawVoteEmote && parseEmojiString(rawVoteEmote)) ?? undefined,
      voteTag: interaction.options.getString('tag') ?? undefined,
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
