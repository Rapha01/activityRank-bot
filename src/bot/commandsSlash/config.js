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
      .setRequired(true)))
  .addSubcommand(sc => sc
    .setName('show-nicknames')
    .setDescription('Whether to represent members by their nicknames or by their Discord usernames')
    .addBooleanOption(o => o
      .setName('enable')
      .setDescription('True: Use server nicknames. False: Use Discord usernames.')
      .setRequired(true)))
  .addSubcommand(sc => sc
    .setName('allow-reaction-voting')
    .setDescription('Whether or not to allow members to vote via reactions')
    .addBooleanOption(o => o
      .setName('enable')
      .setDescription('True: Allow members to vote via reactions. False: Do not allow.')
      .setRequired(true)))
  .addSubcommand(sc => sc
    .setName('allow-muted-xp')
    .setDescription('Whether or not to allow members to gain Voice XP while muted')
    .addBooleanOption(o => o
      .setName('enable')
      .setDescription('True: Allow members to gain XP while muted. False: Do not allow.')
      .setRequired(true)))
  .addSubcommand(sc => sc
    .setName('allow-deafened-xp')
    .setDescription('Whether or not to allow members to gain Voice XP while deafened')
    .addBooleanOption(o => o
      .setName('enable')
      .setDescription('True: Allow members to gain XP while deafened. False: Do not allow.')
      .setRequired(true)))
  .addSubcommand(sc => sc
    .setName('allow-solo-xp')
    .setDescription('Whether or not to allow members to gain Voice XP while alone in a VC. Bots do not count.')
    .addBooleanOption(o => o
      .setName('enable')
      .setDescription('True: Allow members to gain XP while solo. False: Do not allow.')
      .setRequired(true)))
  .addSubcommand(sc => sc
    .setName('taarold')
    .setDescription('Whether or not to remove roles when a member levels down')
    .addBooleanOption(o => o
      .setName('enable')
      .setDescription('Whether to remove roles upon leveldown')
      .setRequired(true)))
  .addSubcommand(sc => sc
    .setName('notify-dm')
    .setDescription('Whether or not to allow members to be notified of their levelups via DM')
    .addBooleanOption(o => o
      .setName('enable')
      .setDescription('True: Allow members to be DMed. False: Do not allow.')
      .setRequired(true)))
  .addSubcommand(sc => sc
    .setName('notify-current-channel')
    .setDescription('Whether or not to allow members to be notified of their levelups via their last used channel')
    .addBooleanOption(o => o
      .setName('enable')
      .setDescription('True: Notify members in their last used channel. False: Do not allow.')
      .setRequired(true)))
  .addSubcommand(sc => sc
    .setName('notify-with-role')
    .setDescription('Whether or not to send levelup messages when a roleAssign message is being sent')
    .addBooleanOption(o => o
      .setName('enable')
      .setDescription('True: Send both messages. False: Send only the roleAssign message.')
      .setRequired(true))) */
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