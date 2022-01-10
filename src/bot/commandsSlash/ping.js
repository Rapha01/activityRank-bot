const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Checks the bot\'s latency'),
  async execute(i) {
    const sent = await i.deferReply({ fetchReply: true });
    const pingEmbed = new MessageEmbed()
      .setColor(0x00AE86)
      .setTitle('🏓 Pong! 🏓')
      .addFields(
        { name: '🔁 Roundtrip Latency 🔁', value: `\`\`\`${sent.createdTimestamp - i.createdTimestamp}ms\`\`\`` },
        { name: '💗 API Heartbeat 💗', value: `\`\`\`${Math.round(i.client.ws.ping)}ms\`\`\`` },
      )
      .setTimestamp()
    await i.editReply({ embeds: [pingEmbed], ephemeral: true });
  }
}