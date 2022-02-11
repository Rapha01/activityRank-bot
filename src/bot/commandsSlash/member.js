const { SlashCommandBuilder } = require('@discordjs/builders');


module.exports = {
  data: new SlashCommandBuilder()
    .setName('member')
    .setDescription('Do something to a member!')
    .addSubcommand(sc => sc
      .setName('give')
      .setDescription('Adds bonus XP to a member')
      .addIntegerOption(o => o
        .setName('amount')
        .setDescription('The amount of XP to give')
        .setMinValue(1)
        .setMaxValue(1_000_000)
        .setRequired(true))
      .addUserOption(o => o
        .setName('member')
        .setDescription('The member to give XP to')
        .setRequired(true)))
    .addSubcommand(sc => sc
      .setName('take')
      .setDescription('Removes bonus XP from a member')
      .addUserOption(o => o
        .setName('member')
        .setDescription('The member to remove XP from')
        .setRequired(true))
      .addIntegerOption(o => o
        .setName('amount')
        .setDescription('The amount of XP to take')
        .setMinValue(1)
        .setMaxValue(1_000_000)
        .setRequired(true))),
};