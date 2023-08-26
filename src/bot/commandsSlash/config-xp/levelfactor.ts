import { PermissionFlagsBits } from 'discord.js';
import guildModel from '../../models/guild/guildModel.js';
import resetModel from '../../models/resetModel.js';

export const execute = async function (i) {
  if (!i.member.permissionsIn(i.channel).has(PermissionFlagsBits.ManageGuild)) {
    return await i.reply({
      content:
        'You need the permission to manage the server in order to use this command.',
      ephemeral: true,
    });
  }
  await guildModel.storage.set(
    i.guild,
    'levelFactor',
    i.options.getInteger('levelfactor')
  );
  resetModel.cache.resetGuildMembersAll(i.guild);
  await i.reply({
    content: `Your levelfactor is now set to \`${i.options.getInteger(
      'levelfactor'
    )}\``,
    ephemeral: true,
  });
};


// GENERATED: start of generated content by `exports-to-default`.
// [GENERATED: exports-to-default:v0]

export default {
    execute,
}

// GENERATED: end of generated content by `exports-to-default`.

