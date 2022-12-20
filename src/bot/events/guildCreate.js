const guildModel = require("../models/guild/guildModel.js");

module.exports = {
  name: "guildCreate",
  execute(guild) {
    return new Promise(async function (resolve, reject) {
      try {
        console.log(`Joined guild ${guild.toString()}`);
        await guildModel.cache.load(guild);

        resolve();
      } catch (e) {
        reject(e);
      }
    });
  },
};
