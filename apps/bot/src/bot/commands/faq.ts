import { EmbedBuilder } from 'discord.js';
import { command } from '#bot/commands.ts';
import { getTexts } from '#models/managerDb/textModel.ts';
import type { TextsFaqs } from '#models/types/external.d.ts';

export default command({
  name: 'faq',
  async execute({ interaction }) {
    const faq = interaction.options.getInteger('number');
    const { faqs } = await getTexts();

    if (!faq) {
      await interaction.reply({ embeds: [faqReducedEmbed(faqs)] });
      return;
    }

    const item = faqs.find((o) => o.id === faq);
    const embed = new EmbedBuilder().setTitle(`**ActivityRank FAQ #${faq}**`).setColor(0x01c3d9);
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

    await interaction.reply({ embeds: [embed] });
  },
  autocompletes: {
    async number({ interaction }) {
      const { faqs } = await getTexts();

      const focused = interaction.options.getFocused();

      interaction.respond(
        faqs
          .filter((faq) => faq.title.includes(focused) || focused.includes(faq.id.toString()))
          .map((o) => ({ name: `#${o.id}: ${o.title}`, value: o.id }))
          .slice(0, 20),
      );
    },
  },
});

function faqReducedEmbed(faqs: TextsFaqs) {
  const embed = new EmbedBuilder().setTitle('**ActivityRank FAQ**').setColor(0x01c3d9);

  if (faqs.length === 0) embed.setDescription('No FAQs to show!');

  const titles = faqs.map((faq) => `**${faq.id}.** ${faq.title} \n`);
  embed.setDescription(
    `Check frequently asked questions for ActivityRank bot. Run /faq again with the \`number\` option set to select a specific FAQ.\n\n${titles.join('')}`,
  );

  return embed;
}
