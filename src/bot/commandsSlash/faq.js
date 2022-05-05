const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');


module.exports = {
  data: new SlashCommandBuilder()
    .setName('faq')
    .setDescription('Displays the FAQ')
    .addIntegerOption(o => o.setName('number').setDescription('The specific FAQ to show')),
  async execute(i) {
    console.log('recieved faq interaction');
    const faq = i.options.getInteger('number');
    const faqs = i.client.appData.texts.faqs;

    if (!faq)
      return await i.reply({ embeds:[faqReducedEmbed(faqs)] });

    if (faq < 1 || faq > 100)
      return await i.reply({ content: 'The FAQ must be within 1 and 100.', ephemeral: true });

    const item = faqs.find(o => o.id == faq);
    const embed = new MessageEmbed()
      .setTitle(`**ActivityRank FAQ #${faq}**`)
      .setColor(0x00AE86)
    ;
    if (!item)
      embed.setDescription(`Could not find an FAQ with ID ${faq}!`);
    else
      embed.addField(`**${item.title}**`, item.desc);

    await i.reply({ embeds:[embed] });
  },
};


function faqReducedEmbed(faqs) {
  const embed = new MessageEmbed()
    .setTitle('**ActivityRank FAQ**')
    .setColor(0x00AE86)
    .setDescription('Check frequently asked questions for ActivityRank bot. You can find a specific FAQ with its number.')
  ;

  if (faqs.length == 0)
    embed.setDescription('No FAQs to show!');

  const titles = faqs.map(faq => `**${faq.id}.** ${faq.title} \n`);
  embed.setDescription(embed.description + '\n\n' + titles.join(''));

  return embed;
}
