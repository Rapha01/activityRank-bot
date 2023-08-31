import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { stripIndent } from 'common-tags';
import guildModel from '../../models/guild/guildModel.js';

export const execute = async function (i) {
  if (!i.member.permissionsIn(i.channel).has(PermissionFlagsBits.ManageGuild)) {
    return await i.reply({
      content: 'You need the permission to manage the server in order to use this command.',
      ephemeral: true,
    });
  }
  const items = {
    bonusEmote: i.options.getString('emote'),
    bonusTag: i.options.getString('tag'),
  };
  if (Object.values(items).every((x) => x === null)) {
    return await i.reply({
      content: 'You must specify at least one option for this command to do anything!',
      ephemeral: true,
    });
  }

  for (const k in items) if (items[k]) await guildModel.storage.set(i.guild, k, items[k]);
  await i.reply({
    embeds: [
      new EmbedBuilder().setAuthor({ name: 'Bonus Tag/Emote' }).setColor(0x00ae86)
        .setDescription(stripIndent`
      Modified the server's settings!

      Bonus Tag: \`${i.guild.appData.bonusTag}\`
      Bonus Emote: ${i.guild.appData.bonusEmote}
      `),
    ],
    ephemeral: true,
  });
};

// GENERATED: start of generated content by `exports-to-default`.
// [GENERATED: exports-to-default:v0]

export default {
  execute,
};

// GENERATED: end of generated content by `exports-to-default`.
