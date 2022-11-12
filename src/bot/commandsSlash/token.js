const { SlashCommandBuilder } = require('discord.js');

module.exports.data = new SlashCommandBuilder()
  .setName('token')
  .setDescription('Gain or use tokens!')
  .addSubcommand(sc => sc
    .setName('get')
    .setDescription('Find out how to gain tokens!'))
  .addSubcommandGroup(scg => scg
    .setName('redeem')
    .setDescription('Use tokens')
    .addSubcommand(sc => sc
      .setName('votepower')
      .setDescription('Double the xp given each time you upvote a member!'))
    .addSubcommand(sc => sc
      .setName('premium')
      .setDescription('Make this server premium!')
      .addIntegerOption(o => o
        .setName('tokens')
        .setDescription('The amount of tokens to add to the server')
        .setMinValue(1)
        .setMaxValue(1_000_000)
        .setRequired(true))));