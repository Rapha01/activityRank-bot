const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const commands = require('../temp/const/commands');

module.exports.data = new SlashCommandBuilder()
  .setName('migrate')
  .setDescription('Look up the new equivalent of a command!')
  .addStringOption(o => o
    .setName('command')
    .setDescription('The command to look up')
    .setRequired(true)
    .setAutocomplete(true));

module.exports.execute = async function(i) {
  const opt = i.options.getString('command').trim();
  let cmd = null;
  cmd = commands.find(o => o.old === opt);

  if (!cmd) {
    return await i.reply({
      content: 'Could not find this command! Be sure you\'ve selected one of the autocomplete options.',
      ephemeral: true,
    });
  }
  await i.reply({
    embeds: [new MessageEmbed()
      .setAuthor({ name: 'ar!' + cmd.old })
      .addField('Description', cmd.desc)
      .addField('Replacement', cmd.new)
      .setColor(0x00AE86)],
  });
};


module.exports.autocomplete = async function(i) {
  let cmds = commands.map(o => o.old.trim());
  const focused = i.options.getFocused().trim().replace('ar!', '');
  cmds = cmds.filter(o => o.includes(focused));
  cmds = cmds.map(o => ({ name: 'ar!' + o, value: o }));
  i.respond(cmds.slice(0, 25));
};