const { SlashCommandBuilder } = require('@discordjs/builders');
const { ChannelType: { GuildText, GuildVoice } } = require('discord-api-types/v9');


/* const _lvl = (desc) => (_ => _
  .setName('level')
  .setDescription(desc)
  .setRequired(true)
  .setMaxValue(2000)
  .setMinValue(0));
 */

module.exports.data = new SlashCommandBuilder()
  .setName('settings')
  .setDescription('Change your server\'s settings!')
  .addSubcommand(sc => sc
    .setName('role-levels')
    .setDescription('Change a role\'s assign- and deassign-levels')
    .addRoleOption(o => o
      .setName('role')
      .setDescription('The role to set levels of')
      .setRequired(true))
    .addIntegerOption(o => o
      .setName('assign-level')
      .setDescription('The level a member must be at to gain this role')
      .setMinValue(1).setMaxValue(2000))
    .addIntegerOption(o => o
      .setName('deassign-level')
      .setDescription('The level a member must be at to lose this role')
      .setMinValue(1).setMaxValue(2000)))
  .addSubcommand(sc => sc
    .setName('role-options')
    .setDescription('Change a role\'s main settings')
    .addRoleOption(o => o
      .setName('role')
      .setDescription('The role to set levels of')
      .setRequired(true)))
  .addSubcommand(sc => sc
    .setName('channel')
    .setDescription('Change a channel\'s settings')
    .addChannelOption(o => o
      .setName('channel').setDescription('The channel to modify')
      .addChannelTypes([GuildText, GuildVoice]).setRequired(true)))
  .addSubcommand(sc => sc
    .setName('xp-per')
    .setDescription('Set the amount of XP gained')
    .addIntegerOption(o => o
      .setName('message')
      .setDescription('The amount of XP gained per message sent')
      .setMinValue(1).setMaxValue(10))
    .addIntegerOption(o => o
      .setName('voiceminute')
      .setDescription('The amount of XP gained per minute spent in VC')
      .setMinValue(1).setMaxValue(5))
    .addIntegerOption(o => o
      .setName('vote')
      .setDescription('The amount of XP gained per upvote')
      .setMinValue(1).setMaxValue(100))
    .addIntegerOption(o => o
      .setName('invite')
      .setDescription('The amount of XP gained per invitation')
      .setMinValue(1).setMaxValue(1000)))
  .addSubcommand(sc => sc
    .setName('cooldown')
    .setDescription('Set the amount of time a member must wait before gaining XP from an activity')
    .addIntegerOption(o => o
      .setName('message')
      .setDescription('The time between messages counting')
      .setMinValue(0)
      .setMaxValue(120)
      .setAutocomplete(true))
    .addIntegerOption(o => o
      .setName('vote')
      .setDescription('The time to wait before a member can vote again')
      .setMinValue(180)
      .setMaxValue(86400)
      .setAutocomplete(true)))
  /* .addSubcommandGroup(sg => sg
    .setName('xp')
    .setDescription('Settings relating to XP gains')
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
        .setAutocomplete(true)))) */
  .addSubcommand(sc => sc
    .setName('bonus-xp-per')
    .setDescription('Set the amount of bonus XP gained during bonus time')
    .addIntegerOption(o => o
      .setName('message')
      .setDescription('The amount of XP gained per message sent')
      .setMinValue(1).setMaxValue(20))
    .addIntegerOption(o => o
      .setName('voiceminute')
      .setDescription('The amount of XP gained per minute spent in VC')
      .setMinValue(1).setMaxValue(10))
    .addIntegerOption(o => o
      .setName('vote')
      .setDescription('The amount of XP gained per upvote')
      .setMinValue(1).setMaxValue(100))
    .addIntegerOption(o => o
      .setName('invite')
      .setDescription('The amount of XP gained per invitation')
      .setMinValue(1).setMaxValue(2000)))
  .addSubcommand(sc => sc
    .setName('bonus-start')
    .setDescription('Starts bonustime for the specified duration')
    .addIntegerOption(o => o
      .setName('time')
      .setDescription('The time for the bonus time to last, in minutes')
      .setMinValue(60)
      .setMaxValue(4320)
      .setRequired(true)
      .setAutocomplete(true)))
  .addSubcommand(sc => sc
    .setName('bonus')
    .setDescription('Set your bonusTag and emote')
    .addStringOption(o => o
      .setName('tag')
      .setDescription('The bonusTag to set'))
    .addStringOption(o => o
      .setName('emote')
      .setDescription('The bonusEmote to set')))
  .addSubcommand(sc => sc
    .setName('vote')
    .setDescription('Set your voteTag and emote')
    .addStringOption(o => o
      .setName('tag')
      .setDescription('The voteTag to set'))
    .addStringOption(o => o
      .setName('emote')
      .setDescription('The voteEmote to set')))
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
      .setRequired(true)))
  .addSubcommand(sc => sc
    .setName('levelfactor')
    .setDescription('Set the levelfactor')
    .addIntegerOption(o => o
      .setName('levelfactor')
      .setDescription('The levelfactor to use in the server')
      .setMinValue(20)
      .setMaxValue(400)
      .setRequired(true)));