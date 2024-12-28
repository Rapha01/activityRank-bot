import { event } from '#bot/util/registry/event.js';
import { Events } from 'discord.js';
import cronScheduler from '../cron/scheduler.js';

export default event(
  Events.ClientReady,
  async function (client) {
    client.logger.info(`Logged in as ${client.user!.tag}!`);

    cronScheduler.start(client);
  },
  { once: true },
);
