import { event } from '#bot/util/registry/event.js';
import { Events } from 'discord.js';
import { getGuildModel } from '#bot/models/guild/guildModel.js';
import { shards } from '#models/shardDb/shardDb.js';
import { roleCache } from '#bot/models/guild/guildRoleModel.js';

export default event(Events.GuildRoleDelete, async (role) => {
  const { dbHost } = await getGuildModel(role.guild);

  roleCache.delete(role);

  await shards
    .get(dbHost)
    .db.deleteFrom('guildRole')
    .where('guildId', '=', role.guild.id)
    .where('roleId', '=', role.id)
    .executeTakeFirstOrThrow();
});
