/* eslint-disable max-len */
import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';

import { stripIndent } from 'common-tags';
import guildModel from '../../models/guild/guildModel.js';
import prettyTime from 'pretty-ms';

export const execute = async function (i) {
  if (!i.member.permissionsIn(i.channel).has(PermissionFlagsBits.ManageGuild)) {
    return await i.reply({
      content:
        'You need the permission to manage the server in order to use this command.',
      ephemeral: true,
    });
  }

  const items = {
    textMessageCooldownSeconds: i.options.getInteger('message'),
    voteCooldownSeconds: i.options.getInteger('vote'),
  };
  if (Object.values(items).every((x) => x === null)) {
    return await i.reply({
      content:
        'You must specify at least one option for this command to do anything!',
      ephemeral: true,
    });
  }

  for (const k in items)
    if (items[k] != null) await guildModel.storage.set(i.guild, k, items[k]);
  await i.reply({
    embeds: [
      new EmbedBuilder()
        .setAuthor({ name: 'Cooldown Values' })
        .setColor(0x00ae86).setDescription(stripIndent`
      Modified Cooldown Values! New values:

      Messages will only give XP if their author has not sent one in the last \`${prettyTime(
        i.guild.appData.textMessageCooldownSeconds * 1000,
        { verbose: true }
      )}\`.
      Votes will have a cooldown of \`${prettyTime(
        i.guild.appData.voteCooldownSeconds * 1000,
        { verbose: true }
      )}\`.
      `),
    ],
    ephemeral: true,
  });
};

export const autocomplete = async (i) => {
  const { name } = i.options.getFocused(true);
  if (name === 'message') {
    await i.respond([
      { name: 'No time', value: 0 },
      { name: '5 seconds', value: 5 },
      { name: '15 seconds', value: 15 },
      { name: '30 seconds', value: 30 },
      { name: '1 minute', value: 60 },
      { name: '2 minutes', value: 120 },
    ]);
  } else {
    await i.respond([
      { name: '3 mins', value: 180 },
      { name: '5 mins', value: 300 },
      { name: '10 mins', value: 600 },
      { name: '30 mins', value: 1800 },
      { name: '1 hour', value: 3600 },
      { name: '3 hours', value: 10800 },
      { name: '6 hours', value: 21600 },
      { name: '12 hours', value: 43200 },
      { name: '24 hours', value: 86400 },
    ]);
  }
};


// GENERATED: start of generated content by `exports-to-default`.
// [GENERATED: exports-to-default:v0]

export default {
    execute,
    autocomplete,
}

// GENERATED: end of generated content by `exports-to-default`.

