import { ApplicationCommandOptionType, PermissionFlagsBits } from 'discord.js';
import { stripIndent } from 'common-tags';
import { getGuildModel } from '../../models/guild/guildModel.js';
import { parseEmojiString } from '#bot/util/emoji.js';
import { command } from '#bot/commands.js';

export default command({
  name: 'config-server bonus',
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

    const rawBonusEmote = options.emote;
    const items = {
      bonusEmote: (rawBonusEmote && parseEmojiString(rawBonusEmote)) ?? undefined,
      bonusTag: options.tag,
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
