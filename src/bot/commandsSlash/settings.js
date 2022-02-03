const { SlashCommandBuilder } = require('@discordjs/builders');
const per = require('./settings/personal');
const ser = require('./settings/server');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('settings')
    .setDescription('Change some settings!')
    .addSubcommand(sc =>
      sc.setName('personal')
        .setDescription('Modify your personal settings'))
    .addSubcommand(sc =>
      sc.setName('server')
        .setDescription('Modify the server\'s settings')),
  async component(i) {
    if (i.customId.split(' ')[1] == 'p') await per.component(i);
    else if (i.customId.split(' ')[1] == 's') await ser.component(i);
  },
};