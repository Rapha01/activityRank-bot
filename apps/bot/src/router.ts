import { zValidator } from '@hono/zod-validator';
import type { Client, Guild, GuildMember, ShardingManager } from 'discord.js';
import { Hono } from 'hono';
import { z } from 'zod';

/*
  This function is passed to [`broadcastEval`]. Therefore, it must be written in a specific way.
  1. The function itself must be serializable. This means it CANNOT call 
     any other functions (that don't exist in a standard nodejs environment).
  2. The `context` argument must be JSON-serializable.
  3. The returned value must be JSON-serializable.
*/
async function getSharedGuildInfo(
  client: Client,
  context: { userGuildIds: string[]; userId: string },
) {
  const { PermissionFlagsBits } = await import('discord.js');
  if (!client.isReady) return { ok: false, err: 'NOT_READY' } as const;
  async function mapGuild(guild: Guild) {
    let member: GuildMember | null = null;
    try {
      member = await guild.members.fetch(context.userId);
    } catch {}
    if (!member) return { isMember: false } as const;

    const permission =
      guild.ownerId === member.id
        ? ('OWNER' as const)
        : member.permissions.has(PermissionFlagsBits.Administrator)
          ? ('ADMINISTRATOR' as const)
          : member.permissions.has(PermissionFlagsBits.ManageGuild) ||
              member.permissions.has(PermissionFlagsBits.BanMembers)
            ? ('MODERATOR' as const)
            : ('MEMBER' as const);

    const guildIcon = guild.icon;

    return { id: guild.id, isMember: true, permission, guildIcon } as const;
  }
  const sharedGuilds = await Promise.all(
    client.guilds.cache.filter((_guild, id) => context.userGuildIds.includes(id)).map(mapGuild),
  );
  return { ok: true, data: sharedGuilds } as const;
}

export function createRouter(manager: ShardingManager) {
  const app = new Hono();

  app.get('/', (c) => c.text('Bot server'));

  const zSnowflake = z.string().min(17).max(20);
  app.post(
    '/shared-guilds',
    zValidator('json', z.object({ userId: zSnowflake, userGuildIds: z.array(zSnowflake) })),
    async (c) => {
      const body = c.req.valid('json');
      const results = await manager.broadcastEval(getSharedGuildInfo, { context: body });
      const sharedGuilds = results.flatMap((result) =>
        result.ok ? result.data.filter((guild) => guild.isMember) : [],
      );
      return c.json({ sharedGuilds });
    },
  );

  return app;
}
