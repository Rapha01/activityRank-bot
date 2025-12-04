import { Events } from 'discord.js';
import { getGuildModel } from '#bot/models/guild/guildModel.ts';
import { event } from '#bot/util/registry/event.ts';

export default event(Events.GuildCreate, async (guild) => {
  guild.client.logger.info(`Joined guild ${guild.toString()}`);
  const cachedGuild = await getGuildModel(guild);

  if (cachedGuild.db.isBanned) {
    guild.client.logger.debug(`Joined banned guild ${guild.id}`);
    await guild.leave();
    return;
  }
});
