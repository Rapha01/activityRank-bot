const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const { botInviteLink } = require('../../const/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Checks the bot\'s latency'),
  async execute(i) {
    const sent = await i.deferReply({ fetchReply: true, ephemeral: true });
    const pingEmbed = new MessageEmbed()
      .setColor(0x00AE86)
      .setTitle('🏓 Pong! 🏓')
      .addFields(
        { name: '🔁 Roundtrip Latency 🔁', value: `\`\`\`${sent.createdTimestamp - i.createdTimestamp}ms\`\`\`` },
        { name: '💗 API Heartbeat 💗', value: `\`\`\`${Math.round(i.client.ws.ping)}ms\`\`\`` },
      )
      .setTimestamp();
    const row = new MessageActionRow()
      .addComponents(new MessageButton().setLabel('Invite the bot').setURL(botInviteLink).setStyle('LINK'));
    await i.editReply({ embeds: [pingEmbed], ephemeral: true, components: [row] });
  },
};