const { SlashCommandBuilder } = require('@discordjs/builders');


module.exports.data = new SlashCommandBuilder()
  .setName('config-role')
  .setDescription('Change a role\'s settings!')
  .addSubcommand(sc => sc
    .setName('menu')
    .setDescription('Launches a menu to modify role settings')
    .addRoleOption(o => o
      .setName('role')
      .setDescription('The role to modify'))
    .addStringOption(o => o
      .setName('id')
      .setDescription('The ID of the role to modify')))
  .addSubcommand(sc => sc
    .setName('levels')
    .setDescription('Set assign/deassign levels for the role')
    .addRoleOption(o => o
      .setName('role')
      .setDescription('The role to modify'))
    .addStringOption(o => o
      .setName('id')
      .setDescription('The ID of the role to modify'))
    .addIntegerOption(o => o
      .setName('assign-level')
      .setDescription('The level a member must be at to gain this role')
      .setMinValue(1).setMaxValue(2000))
    .addIntegerOption(o => o
      .setName('deassign-level')
      .setDescription('The level a member must be at to lose this role')
      .setMinValue(1).setMaxValue(2000)));
