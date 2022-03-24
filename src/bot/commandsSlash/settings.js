const { SlashCommandBuilder } = require('@discordjs/builders');
const { ChannelType: { GuildText } } = require('discord-api-types/v9');


const _lvl = (desc) => (_ => _
  .setName('level')
  .setDescription(desc)
  .setRequired(true)
  .setMaxValue(2000)
  .setMinValue(0));

module.exports.data = new SlashCommandBuilder()
  .setName('settings')
  .setDescription('Change your server\'s settings!')
  .addSubcommandGroup(sg => sg
    .setName('role')
    .setDescription('Change a role\'s settings')
    .addSubcommand(sc => sc
      .setName('assign-level')
      .setDescription('Set the level at which the specified role will be assigned')
      .addRoleOption(o => o.setName('role').setDescription('The role to assign').setRequired(true))
      .addIntegerOption(_lvl('The level at which the role will assign')))
    .addSubcommand(sc => sc
      .setName('deassign-level')
      .setDescription('Set the level at which the specified role will be removed')
      .addRoleOption(o => o.setName('role').setDescription('The role to remove').setRequired(true))
      .addIntegerOption(_lvl('The level at which the role will be removed')))
    .addSubcommand(sc => sc
      .setName('no-xp')
      .setDescription('Set a role to noXp; a user with this role will not gain XP')
      .addRoleOption(o => o.setName('role').setDescription('The role to set as noXp').setRequired(true)))
    .addSubcommand(sc => sc
      .setName('assign-message')
      .setDescription('Set a custom Assign Message, for one role only')
      .addRoleOption(o => o.setName('role').setDescription('The role to give the message to').setRequired(true)))
    .addSubcommand(sc => sc
      .setName('deassign-message')
      .setDescription('Set a custom Deassign Message, for one role only')
      .addRoleOption(o => o.setName('role').setDescription('The role to give the message to').setRequired(true))))
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
      .setDescription('The message to send when a member joins the serrver'))
    .addSubcommand(sc => sc
      .setName('join-channel')
      .setDescription('The channel to post a join message in when a member joins the server')
      .addChannelOption(o => o
        .setName('channel')
        .setDescription('The channel to post the message in')
        .addChannelType(GuildText))
      .addBooleanOption(o => o
        .setName('disable')
        .setDescription(
          'If this is set to true, welcome messages will be disabled. Do not set both this and the channel option.',
        ))));