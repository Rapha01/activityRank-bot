const guildModel = require('../models/guild/guildModel.js');
const Discord = require('discord.js');
const errorMsgs = require('../../const/errorMsgs.js');
const fct = require('../../util/fct.js');

module.exports = (msg,args) => {
  return new Promise(async function (resolve, reject) {
    try {
      const page = fct.extractPage(args,msg.guild.appData.entriesPerPage);

      if (page.number < 1 || page.number > 100) {
        await msg.channel.send('Pagenumber needs to be within 1 and 100.');
        return resolve();
      }

      const faqs = msg.client.appData.texts.faqs.slice(page.from - 1,msg.guild.appData.entriesPerPage);

      await msg.channel.send(faqMainEmbed(faqs));

      resolve();
    } catch (e) { reject(e); }
  });
}

function faqMainEmbed (faqs) {
  const embed = new Discord.MessageEmbed()
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

  return {embed};
  console.log(features);
}
