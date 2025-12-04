import { Events } from 'discord.js';
import { getGuildModel } from '#bot/models/guild/guildModel.ts';
import { roleCache } from '#bot/models/guild/guildRoleModel.ts';
import { event } from '#bot/util/registry/event.ts';
import { shards } from '#models/shardDb/shardDb.ts';

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
