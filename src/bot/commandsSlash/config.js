const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports.data = new SlashCommandBuilder()
  .setName('config')
  .setDescription('Configure the bot!')
  .addSubcommand(sc => sc
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
      .setRequired(true)));