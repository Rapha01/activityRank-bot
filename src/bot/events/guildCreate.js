const guildModel = require('../models/guild/guildModel.js');

module.exports = {
  name: 'guildCreate',
  async execute(guild) {
    console.log(`Joined guild ${guild.toString()}`);
    await guildModel.cache.load(guild);

    if (guild.appData.isBanned) {
      console.log(`Joined banned guild ${guild.id}.`);
      return await guild.leave();
    }
  },
};
