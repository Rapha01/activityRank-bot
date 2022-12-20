const cronScheduler = require("../cron/scheduler.js");

module.exports = {
  name: "disconnect",
  execute(msg, code) {
    if (code === 0) return console.log("client.onDisconnect: ", msg);

    client.connect();
  },
};
