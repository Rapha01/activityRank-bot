const guildModel = require('../models/guild/guildModel.js');
const errorMsgs = require('../../const/errorMsgs.js');
const fct = require('../../util/fct.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('faq')
    .setDescription('See some frequently asked questions.')
    .addIntegerOption(o => o.setName('page').setDescription('[OPTIONAL] FAQ page number')),
  async execute(i) {
    try {
      const inP = i.options.getInteger('page')
      if (inP && inP < 1 || inP > 100)
        return await i.reply({ content: 'Pagenumber must be within 1 and 100, or omitted to  use the default of 1.', ephemeral: true });

      const page = fct.extractPage([ i.options.getInteger('page') ], i.guild.appData.entriesPerPage);

      const faqs = JSON.parse(i.client.appData.texts).faqs.slice(page.from - 1, i.guild.appData.entriesPerPage);

      await i.reply({ embeds: [faqMainEmbed(faqs)] });

    } catch (e) { throw Error(e); }  
  }
}

function faqMainEmbed (faqs) {
  const embed = new MessageEmbed()
    .setTitle('**ActivityRank FAQ**')
    .setColor(0x00AE86)
    .setDescription('Check frequently asked questions for ActivityRank bot. You can go through multiple pages by appending a pagenumber to the command.')
    .setImage('')
    .setThumbnail('')
  ;

  if (faqs.length == 0)
    embed.setDescription('No FAQs to show on this page.');

  for (let faq of faqs) {
    embed.addField(' (' + faq.id + ') ' + faq.title + '',faq.desc);
  }

  return embed;
  console.log(features);
}
