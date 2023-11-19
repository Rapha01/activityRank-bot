import { registerEvent } from 'bot/util/eventLoader.js';
import { Events } from 'discord.js';
import cronScheduler from '../cron/scheduler.js';

registerEvent(
  Events.ClientReady,
  async function (client) {
    client.logger.info(`Logged in as ${client.user!.tag}!`);

    cronScheduler.start(client);
  },
  { once: true },
);
