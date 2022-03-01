const { SlashCommandBuilder } = require('@discordjs/builders');

const _timedef = (_ => _
  .setName('period')
  .setDescription('The time period to check')
  .addChoices([
    ['Day', 'day'],
    ['Week', 'week'],
    ['Month', 'month'],
    ['Year', 'year'],
  ])
);
const _page = (_ => _
  .setName('page')
  .setDescription('The page to list')
  .setMinValue(1)
  .setMaxValue(100)
);

module.exports.data = new SlashCommandBuilder()
  .setName('top')
  .setDescription('Toplists for the server')
  .addSubcommand(sc => sc
    .setName('user')
    .setDescription('The top users in the server!')
    .addStringOption(_timedef)
    .addIntegerOption(_page))
  .addSubcommand(sc => sc
    .setName('channel')
    .setDescription('The top channels in the server!')
    .addStringOption(o => o
      .setName('type')
      .setDescription('The type of channel')
      .addChoice('Text', 'text')
      .addChoice('Voice', 'voice')
      .setRequired(true))
    .addStringOption(_timedef)
    .addIntegerOption(_page))
  .addSubcommand(sc => sc
    .setName('text')
    .setDescription('The top members, ordered by text!')
    .addStringOption(_timedef)
    .addIntegerOption(_page))
  .addSubcommand(sc => sc
    .setName('voice')
    .setDescription('The top members, ordered by voice!')
    .addStringOption(_timedef)
    .addIntegerOption(_page))
  .addSubcommand(sc => sc
    .setName('likes')
    .setDescription('The top members, ordered by likes!')
    .addStringOption(_timedef)
    .addIntegerOption(_page))
  .addSubcommand(sc => sc
    .setName('invites')
    .setDescription('The top members, ordered by invites!')
    .addStringOption(_timedef)
    .addIntegerOption(_page));
/*
  .addSubcommand(sc => sc
    .setName('role')
    .setDescription('The top roles in the server!')
    .addStringOption(_timedef))
*/
