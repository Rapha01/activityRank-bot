import type { Client } from 'discord.js';
import cronScheduler from '../cron/scheduler.js';
import localDeploy from '../util/deploy-local.js';

export default {
  name: 'ready',
  async execute(client: Client) {
    try {
      if (!(process.env.NODE_ENV == 'production')) await localDeploy(client);

      client.logger.info(`Logged in as ${client.user!.tag}!`);

      client.user!.setActivity('Calculating..');
      await cronScheduler.start(client);
    } catch (e) {
      console.error(e);
    }
  },
};
