const { SlashCommandBuilder } = require('@discordjs/builders');

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
      .addRoleOption(o => o.setName('role').setDescription('The role to set as noXp').setRequired(true))),
  );