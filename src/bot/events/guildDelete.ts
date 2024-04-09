import { registerEvent } from 'bot/util/eventLoader.js';
import { Events } from 'discord.js';
import { getGuildModel, guildCache } from '../models/guild/guildModel.js';

registerEvent(Events.GuildDelete, async function (guild) {
  const cachedGuild = await getGuildModel(guild);
  await cachedGuild.upsert({ leftAtDate: Date.now() / 1000 });
  guildCache.delete(guild);
});
