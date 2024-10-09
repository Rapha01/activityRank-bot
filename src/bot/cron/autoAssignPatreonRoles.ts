import { config } from 'const/config.js';
import { dummyDb, executeQueryAll } from '../../models/shardDb/shardDb.js';
import type { Guild } from 'discord.js';

export default async (supportGuild: Guild) => {
  // Get active Patrons and support server members

  const myUsers = await executeQueryAll(
    dummyDb
      .selectFrom('user')
      .selectAll()
      .where('patreonTier', '>', 0)
      .where('patreonTierUntilDate', '>', Math.floor(Date.now() / 1000).toString())
      .compile(),
  );
  const members = await supportGuild.members.fetch();

  for (const member of members.values()) {
    const myUser = myUsers.find((u) => u.userId == member.user.id);

    for (let patreonRole of config.supportServer.patreonRoles) {
      // Remove role, if user has role but no active tier was found
      if (!myUser && member.roles.cache.has(patreonRole.id))
        await member.roles.remove(patreonRole.id);

      if (!myUser) continue;

      // Remove role, if role does not match tier
      if (member.roles.cache.has(patreonRole.id) && myUser.patreonTier != patreonRole.tier)
        await member.roles.remove(patreonRole.id);

      // Add role, if user has active tier and role matches the tier
      if (!member.roles.cache.has(patreonRole.id) && myUser.patreonTier == patreonRole.tier)
        await member.roles.add(patreonRole.id);
    }
  }
};
