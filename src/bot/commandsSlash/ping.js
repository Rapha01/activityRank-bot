const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { botInviteLink } = require("../../const/config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Checks the bot's latency"),
  async execute(i) {
    const sent = await i.deferReply({ fetchReply: true, ephemeral: true });
    const pingEmbed = new EmbedBuilder()
      .setColor(0x00ae86)
      .setTitle("🏓 Pong! 🏓")
      .addFields(
        {
          name: "🔁 Roundtrip Latency 🔁",
          value: `\`\`\`${sent.createdTimestamp - i.createdTimestamp}ms\`\`\``,
        },
        {
          name: "💗 API Heartbeat 💗",
          value: `\`\`\`${Math.round(i.client.ws.ping)}ms\`\`\``,
        }
      )
      .setTimestamp();
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("Invite the bot")
        .setURL(botInviteLink)
        .setStyle(ButtonStyle.Link)
    );
    await i.editReply({
      embeds: [pingEmbed],
      ephemeral: true,
      components: [row],
    });
  },
};
