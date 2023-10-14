import { registerEvent } from 'bot/util/eventLoader.js';
import { Events } from 'discord.js';
import localDeploy from '../util/deploy-local.js';
import cronScheduler from '../cron/scheduler.js';

registerEvent(
  Events.ClientReady,
  async function (client) {
    // TODO make a better deployment process
    if (!(process.env.NODE_ENV == 'production')) await localDeploy(client);

    client.logger.info(`Logged in as ${client.user!.tag}!`);

    cronScheduler.start(client);
  },
  { once: true },
);
