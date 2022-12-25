const guildModel = require('../models/guild/guildModel.js');

module.exports = {
  name: 'guildCreate',
  async execute(guild) {
    guild.client.logger.info(`Joined guild ${guild.toString()}`);
    await guildModel.cache.load(guild);

    if (guild.appData.isBanned) {
      guild.client.logger.debug(`Joined banned guild ${guild.id}`);
      return await guild.leave();
    }
  },
};
