// GENERATED: this file has been altered by `relative-named-imports`.
// [GENERATED: relative-named-imports:v0]

import cronScheduler from '../cron/scheduler.js';
// GENERATED: added extension to relative import
// import localDeploy from '../util/deploy-local';
import localDeploy from '../util/deploy-local.js';

export default {
  name: 'ready',
  async execute(client) {
    try {
      if (!(process.env.NODE_ENV == 'production')) await localDeploy(client);

      client.logger.info(`Logged in as ${client.user.tag}!`);

      client.user.setActivity('Calculating..');
      await cronScheduler.start(client);
    } catch (e) {
      console.error(e);
    }
  },
};
