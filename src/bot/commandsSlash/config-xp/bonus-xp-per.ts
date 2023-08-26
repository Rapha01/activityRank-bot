import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { stripIndent } from 'common-tags';
import guildModel from '../../models/guild/guildModel.js';

export const execute = async function (i) {
  if (!i.member.permissionsIn(i.channel).has(PermissionFlagsBits.ManageGuild)) {
    return await i.reply({
      content:
        'You need the permission to manage the server in order to use this command.',
      ephemeral: true,
    });
  }
  const items = {
    bonusPerTextMessage: i.options.getInteger('message'),
    bonusPerVoiceMinute: i.options.getInteger('voiceminute'),
    bonusPerVote: i.options.getInteger('vote'),
    bonusPerInvite: i.options.getInteger('invite'),
  };
  if (Object.values(items).every((x) => x === null)) {
    return await i.reply({
      content:
        'You must specify at least one option for this command to do anything!',
      ephemeral: true,
    });
  }

  for (const k in items)
    if (items[k] !== null) await guildModel.storage.set(i.guild, k, items[k]);
  await i.reply({
    embeds: [
      new EmbedBuilder()
        .setAuthor({ name: 'Bonus XP Values' })
        .setColor(0x00ae86).setDescription(stripIndent`
      Modified Bonus XP Values! New values:

      \`${i.guild.appData.bonusPerTextMessage} xp\` per text message
      \`${i.guild.appData.bonusPerVoiceMinute} xp\` per minute in VC
      \`${i.guild.appData.bonusPerVote} xp\` per vote
      \`${i.guild.appData.bonusPerInvite} xp\` per invite
      `),
    ],
    ephemeral: true,
  });
};


// GENERATED: start of generated content by `exports-to-default`.
// [GENERATED: exports-to-default:v0]

export default {
    execute,
}

// GENERATED: end of generated content by `exports-to-default`.

