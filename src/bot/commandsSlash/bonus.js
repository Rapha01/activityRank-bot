const { SlashCommandBuilder } = require('discord.js');


module.exports.data = new SlashCommandBuilder()
  .setName('bonus')
  .setDescription('Give/take bonus XP!')
  .addSubcommand(sc => sc
    .setName('role')
    .setDescription('Change the bonus XP of all members with a role')
    .addRoleOption(o => o
      .setName('role')
      .setDescription('The role to modify')
      .setRequired(true))
    .addIntegerOption(o => o
      .setName('give')
      .setDescription('The amount of XP to give to all members with the role')
      .setMinValue(1)
      .setMaxValue(1_000_000))
    .addIntegerOption(o => o
      .setName('take')
      .setDescription('The amount of XP to take from all members with the role')
      .setMinValue(1)
      .setMaxValue(1_000_000)))
  .addSubcommand(sc => sc
    .setName('nrole')
    .setDescription('[BETA ONLY] Change the bonus XP of all members with a role')
    .addRoleOption(o => o
      .setName('role')
      .setDescription('The role to modify')
      .setRequired(true))
    .addIntegerOption(o => o
      .setName('give')
      .setDescription('The amount of XP to give to all members with the role')
      .setMinValue(1)
      .setMaxValue(1_000_000))
    .addIntegerOption(o => o
      .setName('take')
      .setDescription('The amount of XP to take from all members with the role')
      .setMinValue(1)
      .setMaxValue(1_000_000)))
  .addSubcommand(sc => sc
    .setName('member')
    .setDescription('Change a member\'s bonus XP')
    .addUserOption(o => o
      .setName('member')
      .setDescription('The member to modify')
      .setRequired(true))
    .addIntegerOption(o => o
      .setName('give')
      .setDescription('The amount of XP to give to the member')
      .setMinValue(1)
      .setMaxValue(1_000_000))
    .addIntegerOption(o => o
      .setName('take')
      .setDescription('The amount of XP to take from the member')
      .setMinValue(1)
      .setMaxValue(1_000_000)));
