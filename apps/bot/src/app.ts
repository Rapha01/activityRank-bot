import { fileURLToPath } from 'node:url';
import { ShardingManager, type ShardingManagerOptions } from 'discord.js';
import { exposedPort, keys } from '#const/config.ts';
import scheduler from './cron/scheduler.ts';
import fct from './util/fct.ts';
import logger from './util/logger.ts';

if (!process.env.NODE_ENV || process.env.NODE_ENV !== 'production')
  process.env.NODE_ENV = 'development';

const managerOptions: ShardingManagerOptions = { token: keys.botAuth };

const manager = new ShardingManager(
  fileURLToPath(new URL('./bot/bot.ts', import.meta.url)),
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
import { createRouter } from './router.ts';

serve({ fetch: createRouter(manager).fetch, port: exposedPort });
logger.info(`Server listening on port ${exposedPort}`);
logger.info(`[http://0.0.0.0:${exposedPort}]`);

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
