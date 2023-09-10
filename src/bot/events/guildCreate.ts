import type { Guild } from 'discord.js';
import guildModel from '../models/guild/guildModel.js';

export default {
  name: 'guildCreate',
  async execute(guild: Guild) {
    guild.client.logger.info(`Joined guild ${guild.toString()}`);
    await guildModel.cache.load(guild);

    if (guild.appData.isBanned) {
      guild.client.logger.debug(`Joined banned guild ${guild.id}`);
      return await guild.leave();
    }
  },
};
