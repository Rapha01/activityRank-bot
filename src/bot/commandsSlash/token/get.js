const { MessageEmbed } = require('discord.js');

module.exports.execute = async (i) => {
  i.reply({
    embeds: [
      new MessageEmbed()
        .setTitle('Upvote the bot on external platforms to gain a few tokens.')
        .setColor('#4fd6c8')
        .addField('**[*3* tokens]** Top.gg (possible every 12h)', 'https://top.gg/bot/534589798267224065'),
      new MessageEmbed()
        .setTitle('Buy tokens to fuel the bot and redeem for other boosts.')
        .setColor('#4fd6c8')
        .addField('**[ 1€ / *1000* tokens ]**', 'Visit https://activityrank.me/premium to purchase.'),
    ],
    ephemeral: true,
  });
};