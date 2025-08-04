import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import { command } from '#bot/commands.js';
import { config, isProduction } from '#const/config.js';

export default command({
  name: 'ping',
  async execute({ interaction, t }) {
    const sent = await interaction.deferReply({ fetchReply: true, ephemeral: true });

    const pingEmbed = new EmbedBuilder()
      .setColor(0x01c3d9)
      .setTitle(t('ping.title'))
      .setDescription(isProduction ? null : t('ping.isDev'))
      .addFields(
        {
          name: t('ping.latency.name'),
          value: `\`\`\`${t('ping.latency.value', { time: sent.createdTimestamp - interaction.createdTimestamp })}\`\`\``,
        },
        {
          name: t('ping.heartbeat.name'),
          value:
            interaction.client.ws.ping > 0
              ? `\`\`\`${t('ping.heartbeat.value', { time: Math.round(interaction.client.ws.ping) })}\`\`\``
              : t('ping.heartbeat.empty'),
        },
      )
      .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel(t('ping.invite'))
        .setURL(config.invites.standard)
        .setStyle(ButtonStyle.Link),
    );

    await interaction.editReply({
      embeds: [pingEmbed],
      components: [row],
    });
  },
});
