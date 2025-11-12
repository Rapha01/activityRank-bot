import { fileURLToPath } from 'node:url';
import { ShardingManager, type ShardingManagerOptions } from 'discord.js';
import { keys } from '#const/config.js';
import scheduler from './cron/scheduler.js';
import fct from './util/fct.js';
import logger from './util/logger.js';

if (!process.env.NODE_ENV || process.env.NODE_ENV !== 'production')
  process.env.NODE_ENV = 'development';

const managerOptions: ShardingManagerOptions = { token: keys.botAuth };

const manager = new ShardingManager(
  fileURLToPath(new URL('./bot/bot.js', import.meta.url)),
  managerOptions,
);

start().catch(async (e) => {
  logger.fatal(e);
  await fct.waitAndReboot(3000);
});

async function start() {
  await manager.spawn({ delay: 10000, timeout: 120000 });

  await scheduler.start(manager);
}

// Process Exit
process.on('SIGINT', () => {
  logger.warn('SIGINT signal received in Manager');
  process.exit();
});

process.on('SIGTERM', () => {
  logger.warn('SIGTERM signal received in Manager');
  process.exit();
});

import { serve } from '@hono/node-server';
import { createRouter } from './router.js';

const port = process.env.PORT ? Number.parseInt(process.env.PORT) : 3000;
serve({ fetch: createRouter(manager).fetch, port });
console.info(`Server listening on port ${port}`);
console.info(`[http://localhost:${port}]`);

import type pino from 'pino';
import type { StatFlushCache } from '#bot/statFlushCache.ts';
import type { XpFlushCache } from '#bot/xpFlushCache.ts';

declare module 'discord.js' {
  export interface Client {
    logger: pino.Logger;
    statFlushCache: Record<string, StatFlushCache>;
    xpFlushCache: Record<string, XpFlushCache>;
    botShardStat: { commandsTotal: number; textMessagesTotal: number };
  }
}
