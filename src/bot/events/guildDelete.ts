import { event } from '@activityrank/lupus';
import { getGuildModel, guildCache } from 'bot/models/guild/guildModel.js';

export default event(event.discord.GuildDelete, async function (guild) {
  const cachedGuild = await getGuildModel(guild);
  await cachedGuild.upsert({ leftAtDate: (Date.now() / 1000).toString() });
  guildCache.delete(guild);
});
