const { SlashCommandBuilder } = require('@discordjs/builders');


module.exports.data = new SlashCommandBuilder()
  .setName('config-role')
  .setDescription('Change a role\'s settings!')
  .addRoleOption(o => o
    .setName('role')
    .setDescription('The role to modify')
    .setRequired(true));
