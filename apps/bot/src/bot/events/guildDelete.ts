import { event } from '#bot/util/registry/event.js';
import { Events } from 'discord.js';
import { getGuildModel, guildCache } from '#bot/models/guild/guildModel.js';

export default event(Events.GuildDelete, async (guild) => {
  const cachedGuild = await getGuildModel(guild);
  await cachedGuild.upsert({ leftAtDate: (Date.now() / 1000).toString() });
  guildCache.delete(guild);
});
