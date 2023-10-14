import { registerEvent } from 'bot/util/eventLoader.js';
import { Events } from 'discord.js';
import guildModel from '../models/guild/guildModel.js';

registerEvent(Events.GuildDelete, async function (guild) {
  await guildModel.cache.load(guild);
  await guildModel.storage.set(guild, 'leftAtDate', Date.now() / 1000);
});
