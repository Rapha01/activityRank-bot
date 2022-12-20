const cronScheduler = require("../cron/scheduler.js");
const localDeploy = require("../util/deploy-local");

module.exports = {
  name: "ready",
  async execute(client) {
    try {
      if (!(process.env.NODE_ENV == "production")) await localDeploy(client);

      console.log(`Logged in as ${client.user.tag}!`);
      client.user.setActivity("Calculating..");
      await cronScheduler.start(client);
    } catch (e) {
      console.error(e);
    }
  },
};
