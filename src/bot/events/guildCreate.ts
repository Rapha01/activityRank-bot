import { event } from '@activityrank/lupus';
import { getGuildModel } from 'bot/models/guild/guildModel.js';

export default event(event.discord.GuildCreate, async function (guild) {
  guild.client.logger.info(`Joined guild ${guild.toString()}`);
  const cachedGuild = await getGuildModel(guild);

  if (cachedGuild.db.isBanned) {
    guild.client.logger.debug(`Joined banned guild ${guild.id}`);
    await guild.leave();
    return;
  }
});
