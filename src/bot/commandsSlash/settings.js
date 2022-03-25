const { SlashCommandBuilder } = require('@discordjs/builders');
const { ChannelType: { GuildText } } = require('discord-api-types/v9');


const _lvl = (desc) => (_ => _
  .setName('level')
  .setDescription(desc)
  .setRequired(true)
  .setMaxValue(2000)
  .setMinValue(0));

const _xpPer = (min, max) => (_ => _
  .setName('amount')
  .setDescription('The amount of XP to give for this activity')
  .setMinValue(min)
  .setMaxValue(max)
  .setRequired(true));

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
      .setDescription('The message to send when a member joins the server'))
    .addSubcommand(sc => sc
      .setName('join-channel')
      .setDescription('The channel to post a join message in when a member joins the server')
      .addChannelOption(o => o
        .setName('channel')
        .setDescription('The channel to post the message in')
        .addChannelType(GuildText))
      .addBooleanOption(o => o
        .setName('disable')
        .setDescription('If this is set to true, welcome messages will be disabled.')))
    .addSubcommand(sc => sc
      .setName('levelup-message')
      .setDescription('The message to send when a member levels up'))
    .addSubcommand(sc => sc
      .setName('levelup-channel')
      .setDescription('The channel to post a levelup message in when a member levels up')
      .addChannelOption(o => o
        .setName('channel')
        .setDescription('The channel to post the message in')
        .addChannelType(GuildText))
      .addBooleanOption(o => o
        .setName('disable')
        .setDescription('If this is set to true, levelup messages will be disabled.'))))
  .addSubcommandGroup(sg => sg
    .setName('xp')
    .setDescription('Settings relating to XP gains')
    .addSubcommand(sc => sc
      .setName('xp-per-message')
      .setDescription('The amount of XP gained per text message')
      .addIntegerOption(_xpPer(1, 10)))
    .addSubcommand(sc => sc
      .setName('xp-per-voiceminute')
      .setDescription('The amount of XP gained per minute spent in a voice call')
      .addIntegerOption(_xpPer(1, 5)))
    .addSubcommand(sc => sc
      .setName('xp-per-invite')
      .setDescription('The amount of XP gained per user invited')
      .addIntegerOption(_xpPer(1, 1000)))
    .addSubcommand(sc => sc
      .setName('xp-per-vote')
      .setDescription('The amount of XP gained per upvote')
      .addIntegerOption(_xpPer(1, 100)))
    .addSubcommand(sc => sc
      .setName('message-cooldown')
      .setDescription('The amount of time a member must wait before gaining XP from a message')
      .addIntegerOption(o => o
        .setName('time')
        .setDescription('The time to wait, in seconds')
        .setMinValue(0)
        .setMaxValue(120)
        .setRequired(true)
        .setAutocomplete(true)))
    .addSubcommand(sc => sc
      .setName('vote-cooldown')
      .setDescription('The amount of time a member must wait before upvoting again')
      .addIntegerOption(o => o
        .setName('time')
        .setDescription('The time to wait, in seconds')
        .setMinValue(180)
        .setMaxValue(86400)
        .setRequired(true)
        .setAutocomplete(true))))
  .addSubcommandGroup(sg => sg
    .setName('bonus')
    .setDescription('Settings relating to bonus XP and bonustime')
    .addSubcommand(sc => sc
      .setName('xp-per-message')
      .setDescription('The amount of bonus XP gained per text message during bonus time')
      .addIntegerOption(_xpPer(1, 20)))
    .addSubcommand(sc => sc
      .setName('xp-per-voiceminute')
      .setDescription('The amount of bonus XP gained per minute spent in a voice call during bonus time')
      .addIntegerOption(_xpPer(1, 10)))
    .addSubcommand(sc => sc
      .setName('xp-per-vote')
      .setDescription('The amount of bonus XP gained per upvote during bonus time')
      .addIntegerOption(_xpPer(1, 100)))
    .addSubcommand(sc => sc
      .setName('start')
      .setDescription('Starts bonus time for the specified duration')
      .addIntegerOption(o => o
        .setName('time')
        .setDescription('The time for the bonus time to last, in minutes')
        .setMinValue(60)
        .setMaxValue(4320)
        .setRequired(true)
        .setAutocomplete(true))))
  .addSubcommand(sc => sc
    .setName('use-module')
    .setDescription('Enable or disable a module')
    .addStringOption(o => o
      .setName('module')
      .setDescription('The module to enable or disable')
      .addChoices([
        ['Text Messages', 'textXp'],
        ['Time in VC', 'voiceXp'],
        ['Upvotes', 'voteXp'],
        ['Invited Members', 'inviteXp'],
      ])
      .setRequired(true))
    .addBooleanOption(o => o
      .setName('enabled')
      .setDescription('Whether or not this module should be enabled')
      .setRequired(true)));