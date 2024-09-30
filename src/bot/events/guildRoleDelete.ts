import { event } from 'bot/util/registry/event.js';
import { Events } from 'discord.js';
import { getGuildModel } from 'bot/models/guild/guildModel.js';
import { getShardDb } from 'models/shardDb/shardDb.js';

export default event(Events.GuildRoleDelete, async function (role) {
  const { dbHost } = await getGuildModel(role.guild);
  const db = getShardDb(dbHost);

  await db
    .deleteFrom('guildRole')
    .where('guildId', '=', role.guild.id)
    .where('roleId', '=', role.id)
    .executeTakeFirstOrThrow();
});
