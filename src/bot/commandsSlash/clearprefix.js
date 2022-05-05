const { SlashCommandBuilder } = require('@discordjs/builders');
const guildModel = require('../models/guild/guildModel.js');

module.exports.data = new SlashCommandBuilder()
  .setName('clearprefix')
  .setDescription('Clears your legacy prefix!');

module.exports.execute = async function(i) {
  if (!i.member.permissionsIn(i.channel).has('MANAGE_GUILD')) {
    return await i.reply({
      content: 'You need the permission to manage the server, in order to use this command.',
      ephemeral: true,
    });
  }
  await guildModel.storage.set(i.guild, 'prefix', 'fAY1md_BXaN4mnebk_zzyYuYYJREoT3');
  await i.reply({
    content: 'Prefix cleared.',
  });
};