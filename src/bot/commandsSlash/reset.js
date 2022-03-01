const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports.data = new SlashCommandBuilder()
  .setName('reset')
  .setDescription('Reset your server or members')
  .addSubcommand(sc => sc
    .setName('server')
    .setDescription('Reset server statistics')
    .addStringOption(o => o
      .setName('type')
      .setDescription('The type of reset to execute')
      .addChoices([
        ['Stats & Settings', 'all'],
        ['All Statistics', 'stats'],
        ['All Server Settings', 'settings'],
        ['Text XP', 'textstats'],
        ['Voice XP', 'voicestats'],
        ['Invite XP', 'invitestats'],
        ['Upvote XP', 'votestats'],
        ['Bonus XP', 'bonusstats'],
        ['Members no longer in the server', 'deletedmembers'],
        ['Deleted channels', 'deletedchannels'],
        ['Cancel Active Resets', 'stop'],
      ])
      .setRequired(true)))
  .addSubcommand(sc => sc
    .setName('member')
    .setDescription('Reset a member')
    .addUserOption(o => o
      .setName('member')
      .setDescription('The member to reset'))
    .addStringOption(o => o
      .setName('id')
      .setDescription('The ID of the member to reset')))
  .addSubcommand(sc => sc
    .setName('channel')
    .setDescription('Reset a channel')
    .addChannelOption(o => o
      .setName('channel')
      .setDescription('The channel to reset'))
    .addStringOption(o => o
      .setName('id')
      .setDescription('The ID of the channel to reset')));