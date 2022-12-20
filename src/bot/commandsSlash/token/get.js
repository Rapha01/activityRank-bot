const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

module.exports.execute = async (i) => {
  await i.reply({
    embeds: [
      new EmbedBuilder()
        .setTitle('Upvote the bot on external platforms to gain a few tokens.')
        .setColor('#4fd6c8')
        .addFields({
          name: '**[*3* tokens]** Top.gg (possible every 12h)',
          value: 'https://top.gg/bot/534589798267224065',
        }),
      new EmbedBuilder()
        .setTitle('Buy tokens to fuel the bot and redeem for other boosts.')
        .setColor('#4fd6c8')
        .addFields({
          name: '**[ 1€ / *1000* tokens ]**',
          value: 'Visit https://activityrank.me/premium to purchase.',
        }),
    ],
    ephemeral: true,
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setStyle(ButtonStyle.Link)
          .setLabel('Upvote the bot')
          .setURL('https://top.gg/bot/534589798267224065'),
        new ButtonBuilder()
          .setStyle(ButtonStyle.Link)
          .setLabel('Buy tokens')
          .setURL('https://activityrank.me/premium')
          .setEmoji('1012812559679770687')
      ),
    ],
  });
};
