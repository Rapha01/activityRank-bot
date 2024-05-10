import { event } from '@activityrank/lupus';
import cronScheduler from '../cron/scheduler.js';

export default event(
  event.discord.ClientReady,
  async function (client) {
    client.logger.info(`Logged in as ${client.user!.tag}!`);

    cronScheduler.start(client);
  },
  { once: true },
);
