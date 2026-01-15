import { subtle } from 'node:crypto';
import consume from 'node:stream/consumers';
import { getHeapSnapshot } from 'node:v8';
import { zValidator } from '@hono/zod-validator';
import type { Client, Guild, GuildMember, ShardingManager } from 'discord.js';
import { Hono } from 'hono';
import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import { keys } from '#const/config.ts';

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

    return {
      id: guild.id,
      name: guild.name,
      isMember: true,
      permission,
      icon: guild.icon,
      banner: guild.banner,
    } as const;
  }
  const sharedGuilds = await Promise.all(
    client.guilds.cache.filter((_guild, id) => context.userGuildIds.includes(id)).map(mapGuild),
  );
  return { ok: true, data: sharedGuilds } as const;
}

async function getShardHeap() {
  const { getHeapSnapshot } = await import('node:v8');
  const { text } = await import('node:stream/consumers');

  const then = performance.now();
  const snapshot = JSON.parse(await text(getHeapSnapshot()));
  return { snapshot, duration: performance.now() - then };
}

export function createRouter(manager: ShardingManager) {
  const app = new Hono();

  app.use(InternalAuth);

  app.get('/', (c) => c.text('Bot server'));

  app.get('/snapshot', async (c) => {
    const then = performance.now();
    const snapshot = JSON.parse(await consume.text(getHeapSnapshot()));
    return c.json({ snapshot, duration: performance.now() - then });
  });

  app.get('/snapshot/:shard', async (c) => {
    const shardParam = c.req.param('shard');
    const shardId = Number.parseInt(shardParam);
    if (shardId < 0 || Number.isNaN(shardId)) {
      return c.text('Invalid shard ID', 400);
    }

    const shard = manager.shards.get(shardId);
    if (!shard) {
      return c.text('Shard not found', 404);
    }

    const res = await shard.eval(getShardHeap);
    return c.json(res);
  });

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

const PREFIX = 'Bearer';
const HEADER = 'Authorization';
const HEADER_RE = new RegExp(`^${PREFIX} ([A-Za-z0-9-]+) *$`);

export const InternalAuth = createMiddleware(async (c, next) => {
  const headerToken = c.req.header(HEADER);
  if (!headerToken) {
    // No Authorization header
    throw new HTTPException(401, { message: 'No Authorization header provided' });
  }
  const headerMatch = HEADER_RE.exec(headerToken);
  if (!headerMatch) {
    // Incorrectly formatted Authorization header
    throw new HTTPException(400, { message: 'Invalid Authorization Header' });
  }

  const token = headerMatch[1];
  const equal = await timingSafeEqual(token, keys.managerApiAuth);

  if (!equal) {
    // Invalid Token
    throw new HTTPException(401, { message: 'Invalid Token' });
  }

  await next();
});

// https://github.com/honojs/hono/blob/2ead4d8faa58d187bf7ec74bac2160bab882eab0/src/utils/buffer.ts#L29
async function timingSafeEqual(a: string, b: string) {
  const [sa, sb] = await Promise.all([sha256(a), sha256(b)]);
  return sa === sb && a === b;
}

// https://github.com/honojs/hono/blob/2ead4d8faa58d187bf7ec74bac2160bab882eab0/src/utils/crypto.ts#L33
async function sha256(data: string): Promise<string> {
  const sourceBuffer = new TextEncoder().encode(data);
  const buffer = await subtle.digest({ name: 'SHA-256' }, sourceBuffer);
  const hash = Array.prototype.map
    .call(new Uint8Array(buffer), (x) => `00${x.toString(16)}`.slice(-2))
    .join('');
  return hash;
}
