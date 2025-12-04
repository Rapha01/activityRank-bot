import { Events } from 'discord.js';
import { event } from '#bot/util/registry/event.ts';
import cronScheduler from '../cron/scheduler.ts';

export default event(
  Events.ClientReady,
  async (client) => {
    client.logger.info(`Logged in as ${client.user?.tag}!`);

    cronScheduler.start(client);
  },
  { once: true },
);
