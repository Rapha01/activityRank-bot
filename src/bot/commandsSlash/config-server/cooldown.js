/* eslint-disable max-len */
const { MessageEmbed } = require('discord.js');
const { stripIndent } = require('common-tags');
const guildModel = require('../../models/guild/guildModel.js');
const prettyTime = require('pretty-ms');


module.exports.execute = async function(i) {
  if (!i.member.permissionsIn(i.channel).has('MANAGE_GUILD')) {
    return i.reply({
      content: 'You need the permission to manage the server in order to use this command.',
      ephemeral: true,
    });
  }

  const items = {
    textMessageCooldownSeconds: i.options.getInteger('message'),
    voteCooldownSeconds: i.options.getInteger('vote'),
  };
  if (Object.values(items).every(x => x === null)) {
    return i.reply({
      content: 'You must specify at least one option for this command to do anything!',
      ephemeral: true,
    });
  }

  for (const k in items) if (items[k] != null) await guildModel.storage.set(i.guild, k, items[k]);
  i.reply({
    embeds: [new MessageEmbed().setAuthor({ name: 'Cooldown Values' }).setColor(0x00AE86)
      .setDescription(stripIndent`
      Modified Cooldown Values! New values:

      Messages will only give XP if their author has not sent one in the last \`${prettyTime(i.guild.appData.textMessageCooldownSeconds * 1000, { verbose: true })}\`.
      Votes will have a cooldown of \`${prettyTime(i.guild.appData.voteCooldownSeconds * 1000, { verbose: true })}\`.
      `)],
    ephemeral: true,
  });
};

module.exports.autocomplete = async (i) => {
  const { name } = i.options.getFocused(true);
  console.log(name);
  if (name === 'message') {
    i.respond([
      { name: 'No time', value: 0 },
      { name: '5 seconds', value: 5 },
      { name: '15 seconds', value: 15 },
      { name: '30 seconds', value: 30 },
      { name: '1 minute', value: 60 },
      { name: '2 minutes', value: 120 },
    ]);
  } else {
    i.respond([
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