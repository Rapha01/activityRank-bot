import { config } from 'const/config.js';
import shardDb from '../../models/shardDb/shardDb.js';
import type { Guild } from 'discord.js';
import type { UserSchema } from 'models/types/shard.js';

export default async (supportGuild: Guild) => {
  // Get active Patrons and support server members
  const myUsers = await shardDb.queryAllHosts<UserSchema>(
    `SELECT * FROM user WHERE patreonTier > 0 && patreonTierUntilDate > ${Date.now() / 1000}`,
  );
  const members = await supportGuild.members.fetch();

  for (const _member of members) {
    const member = _member[1];
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
