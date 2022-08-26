const { SlashCommandBuilder } = require('discord.js');


module.exports = {
  data: new SlashCommandBuilder()
    .setName('role')
    .setDescription('Do something to a role!')
    .addSubcommand(sc => sc
      .setName('give')
      .setDescription('Adds bonus XP to all members with a role')
      .addRoleOption(o => o
        .setName('role')
        .setDescription('The role to give XP to')
        .setRequired(true))
      .addIntegerOption(o => o
        .setName('amount')
        .setDescription('The amount of XP to give')
        .setMinValue(1)
        .setMaxValue(1_000_000)
        .setRequired(true)))
    .addSubcommand(sc => sc
      .setName('take')
      .setDescription('Removes bonus XP from all members with a role')
      .addRoleOption(o => o
        .setName('role')
        .setDescription('The role to remove XP from')
        .setRequired(true))
      .addIntegerOption(o => o
        .setName('amount')
        .setDescription('The amount of XP to take')
        .setMinValue(1)
        .setMaxValue(1_000_000)
        .setRequired(true))),
};