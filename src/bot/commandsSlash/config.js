const { SlashCommandBuilder } = require('@discordjs/builders');
const { ChannelType: { GuildText } } = require('discord-api-types/v9');


module.exports.data = new SlashCommandBuilder()
  .setName('config')
  .setDescription('Configure the bot!')
  /* .addSubcommand(sc => sc
    .setName('entries-per-page')
    .setDescription('The number of items to display per embed')
    .addIntegerOption(o => o
      .setName('number')
      .setDescription('The number of entries per page')
      .setMinValue(4)
      .setMaxValue(20)
      .setRequired(true)))*/
  .addSubcommandGroup(sg => sg
    .setName('autosend')
    .setDescription('Change autosend messages')
    .addSubcommand(sc => sc
      .setName('assign-message')
      .setDescription('Set the Assign Message, for when no custom one is set'))
    .addSubcommand(sc => sc
      .setName('deassign-message')
      .setDescription('Set the Deassign Message, for when no custom one is set'))
    .addSubcommand(sc => sc
      .setName('join-message')
      .setDescription('The message to send when a member joins the server'))
    .addSubcommand(sc => sc
      .setName('join-channel')
      .setDescription('The channel to post a join message in when a member joins the server')
      .addChannelOption(o => o
        .setName('channel')
        .setDescription('The channel to post the message in')
        .addChannelType(GuildText)))
    .addSubcommand(sc => sc
      .setName('levelup-message')
      .setDescription('The message to send when a member levels up'))
    .addSubcommand(sc => sc
      .setName('levelup-channel')
      .setDescription('The channel to post a levelup message in when a member levels up')
      .addChannelOption(o => o
        .setName('channel')
        .setDescription('The channel to post the message in')
        .addChannelType(GuildText))));