import scheduler from './cron/scheduler.js';
import fct from './util/fct.js';
import { get as getKeys } from './const/keys.js';
import { ShardingManager } from 'discord.js';
import logger from './util/logger.js';

if (!process.env.NODE_ENV || process.env.NODE_ENV != 'production')
  process.env.NODE_ENV = 'development';

const managerOptions = {
  token: getKeys().botAuth,
  // shardList: Array.from(Array(20).keys()),
  // totalShards: 20
};
const manager = new ShardingManager('./dist/bot/bot.js', managerOptions);

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
});

process.on('SIGTERM', () => {
  logger.warn('SIGTERM signal received in Manager');
});
