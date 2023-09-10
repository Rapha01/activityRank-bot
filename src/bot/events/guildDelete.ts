import type { Guild } from 'discord.js';
import guildModel from '../models/guild/guildModel.js';

export default {
  name: 'guildDelete',
  async execute(guild: Guild) {
    await guildModel.cache.load(guild);
    await guildModel.storage.set(guild, 'leftAtDate', Date.now() / 1000);
  },
};
