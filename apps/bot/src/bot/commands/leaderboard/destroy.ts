import { Routes } from 'discord.js';
import { command } from '#bot/commands.ts';
import { deserializeWebhook } from '#bot/cron/updateLeaderboards.ts';
import { getGuildModel } from '#bot/models/guild/guildModel.ts';

export default command({
  name: 'leaderboard destroy',
  async execute({ interaction }) {
    const guildModel = await getGuildModel(interaction.guild);
    const data = await guildModel.fetch();
    if (!data.leaderboardWebhook) {
      await interaction.reply({
        content: 'You do not have an active leaderboard.',
      });
      return;
    }

    const { id, token, messageId } = deserializeWebhook(data.leaderboardWebhook);

    try {
      await interaction.client.rest.delete(Routes.webhookMessage(id, token, messageId));
      await interaction.client.rest.delete(Routes.webhook(id, token));
    } catch {
      // doesn't matter if the webhook or message is already deleted
    }

    await guildModel.upsert({ leaderboardWebhook: null });
    await interaction.reply({
      content: 'Your leaderboard has been disabled.',
    });
  },
});
