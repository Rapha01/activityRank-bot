import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('faq')
    .setDescription('Displays the FAQ')
    .addIntegerOption((o) =>
      o.setName('number').setDescription('The specific FAQ to show').setAutocomplete(true),
    ),
  async execute(i) {
    const faq = i.options.getInteger('number');
    const faqs = i.client.appData.texts.faqs;

    if (!faq) return await i.reply({ embeds: [faqReducedEmbed(faqs)] });

    if (faq < 1 || faq > 100)
      return await i.reply({
        content: 'The FAQ must be within 1 and 100.',
        ephemeral: true,
      });

    const item = faqs.find((o) => o.id == faq);
    const embed = new EmbedBuilder().setTitle(`**ActivityRank FAQ #${faq}**`).setColor(0x00ae86);
    if (!item) {
      embed.setDescription(`Could not find an FAQ with ID ${faq}!`);
    } else {
      embed.addFields({
        name: `**${item.title}**`,
        value: item.desc
          .replace(/<a.*?href="(.*?)".*?>(.*?)<\/a>/g, '[$2]($1)')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/<\/?code>/g, '`')
          .replace(/<br>/g, '\n')
          .replace(/<(?:strong|b)>/g, '**')
          .replace(/<(?:em|i)>/g, '*'),
      });
    }

    await i.reply({ embeds: [embed] });
  },
  async autocomplete(i) {
    let faqs = i.client.appData.texts.faqs;
    const focused = i.options.getFocused();
    faqs = faqs.filter((faq) => faq.title.includes(focused) || focused.includes(faq.id));

    faqs = faqs.map((o) => ({ name: `#${o.id}: ${o.title}`, value: o.id }));
    i.respond(faqs.slice(0, 20));
  },
};

function faqReducedEmbed(faqs) {
  const embed = new EmbedBuilder().setTitle('**ActivityRank FAQ**').setColor(0x00ae86);

  if (faqs.length == 0) embed.setDescription('No FAQs to show!');

  const titles = faqs.map((faq) => `**${faq.id}.** ${faq.title} \n`);
  embed.setDescription(
    'Check frequently asked questions for ActivityRank bot. You can find a specific FAQ with its number.' +
      '\n\n' +
      titles.join(''),
  );

  return embed;
}
