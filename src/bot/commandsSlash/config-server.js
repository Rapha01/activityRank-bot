const { SlashCommandBuilder } = require('@discordjs/builders');


module.exports.data = new SlashCommandBuilder()
  .setName('config-server')
  .setDescription('Change your server\'s settings!')
  .addSubcommand(sc => sc
    .setName('bonus')
    .setDescription('Set your bonusTag and emote')
    .addStringOption(o => o
      .setName('tag')
      .setDescription('The bonusTag to set'))
    .addStringOption(o => o
      .setName('emote')
      .setDescription('The bonusEmote to set')))
  .addSubcommand(sc => sc
    .setName('vote')
    .setDescription('Set your voteTag and emote')
    .addStringOption(o => o
      .setName('tag')
      .setDescription('The voteTag to set'))
    .addStringOption(o => o
      .setName('emote')
      .setDescription('The voteEmote to set')))
  .addSubcommand(sc => sc
    .setName('set')
    .setDescription('Open a button menu to configure'));
