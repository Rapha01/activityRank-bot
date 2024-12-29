import { ApplicationCommandOptionType, PermissionFlagsBits } from 'discord.js';
import { stripIndent } from 'common-tags';
import { getGuildModel } from '../../models/guild/guildModel.js';
import { parseEmojiString } from '#bot/util/emoji.js';
import { subcommand } from '#bot/util/registry/command.js';

export const bonus = subcommand({
  data: {
    name: 'bonus',
    description: 'Set your bonusTag and emote.',
    type: ApplicationCommandOptionType.Subcommand,
    options: [
      {
        name: 'tag',
        description: 'The bonusTag to set.',
        type: ApplicationCommandOptionType.String,
      },
      {
        name: 'emote',
        description: 'The bonusEmote to set.',
        type: ApplicationCommandOptionType.String,
      },
    ],
  },
  async execute({ interaction }) {
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

    const rawBonusEmote = interaction.options.getString('emote');
    const items = {
      bonusEmote: (rawBonusEmote && parseEmojiString(rawBonusEmote)) ?? undefined,
      bonusTag: interaction.options.getString('tag') ?? undefined,
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
          author: { name: 'Bonus Tag/Emote' },
          color: 0x00ae86,
          description: stripIndent`
            Modified the server's settings!
      
            Bonus Tag: \`${cachedGuild.db.bonusTag}\`
            Bonus Emote: ${cachedGuild.db.bonusEmote}
            `,
        },
      ],
      ephemeral: true,
    });
  },
});
