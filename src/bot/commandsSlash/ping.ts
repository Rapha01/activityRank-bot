import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { registerSlashCommand } from 'bot/util/commandLoader.js';
import { config, isProduction } from 'const/config.js';

registerSlashCommand({
  data: new SlashCommandBuilder().setName('ping').setDescription("Checks the bot's latency"),
  execute: async function (interaction) {
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
          value: `\`\`\`${Math.round(interaction.client.ws.ping)}ms\`\`\``,
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
