import { command } from '#bot/util/registry/command.js';
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { config, isProduction } from '#const/config.js';

export default command.basic({
  data: { name: 'ping', description: "Checks the bot's latency" },
  async execute({ interaction }) {
    const sent = await interaction.deferReply({ fetchReply: true, ephemeral: true });

    const pingEmbed = new EmbedBuilder()
      .setColor(0x00ae86)
      .setTitle('🏓 Pong! 🏓')
      .setDescription(isProduction ? null : '**This is a development version of ActivityRank.**')
      .addFields(
        {
          name: '🔁 Roundtrip Latency 🔁',
          value: `\`\`\`${sent.createdTimestamp - interaction.createdTimestamp}ms\`\`\``,
        },
        {
          name: '💗 API Heartbeat 💗',
          value:
            interaction.client.ws.ping > 0
              ? `\`\`\`${Math.round(interaction.client.ws.ping)}ms\`\`\``
              : '*Not enough uptime*',
        },
      )
      .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel('Invite the bot')
        .setURL(config.invite.standard)
        .setStyle(ButtonStyle.Link),
    );

    await interaction.editReply({
      embeds: [pingEmbed],
      components: [row],
    });
  },
});
