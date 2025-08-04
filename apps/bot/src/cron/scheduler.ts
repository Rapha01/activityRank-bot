import { Time } from '@sapphire/duration';
import { Cron } from 'croner';
import type { ShardingManager } from 'discord.js';
import { isProduction } from '#const/config.js';
import { updateTexts } from '#models/managerDb/textModel.js';
import statFlush from '../models/shardDb/statFlush.js';
import fct from '../util/fct.js';
import checkForDeadShards from './checkForDeadShards.js';
import checkQueuedShardRestarts from './checkQueuedShardRestarts.js';
import saveBotShardHealth from './saveBotShardHealth.js';

const UPDATE_TEXTS_INTERVAL = isProduction ? Time.Minute * 5 : Time.Second * 10;
const SAVE_BOT_SHARD_HEALTH_INTERVAL = isProduction ? Time.Minute * 3 : Time.Second * 8;
const STAT_FLUSH_CACHE_CRON = isProduction ? '30 * * * * *' : '*/10 * * * * *';
const CHECK_DEAD_SHARDS_INTERVAL = isProduction ? Time.Minute * 20 : Time.Second * 30;
const CHECK_QUEUED_SHARD_RESTARTS_INTERVAL = Time.Minute * 2;

export async function start(manager: ShardingManager) {
  //startStatFlush(manager);
  startUpdateTexts();
  startSaveBotShardHealth(manager);
  startCheckForDeadShards(manager);

  if (isProduction) startCheckQueuedShardRestarts(manager);

  new Cron(STAT_FLUSH_CACHE_CRON, async () => {
    try {
      await statFlush(manager);
    } catch (e) {
      console.log(e);
    }
  });
}

async function startUpdateTexts() {
  while (true) {
    try {
      await updateTexts();
    } catch (e) {
      console.log(e);
    }

    await fct.sleep(UPDATE_TEXTS_INTERVAL);
  }
}

async function startSaveBotShardHealth(manager: ShardingManager) {
  while (true) {
    await saveBotShardHealth(manager).catch((e) => console.log(e));
    await fct.sleep(SAVE_BOT_SHARD_HEALTH_INTERVAL);
  }
}

const startCheckQueuedShardRestarts = async (manager: ShardingManager) => {
  while (true) {
    await fct.sleep(CHECK_QUEUED_SHARD_RESTARTS_INTERVAL);
    await checkQueuedShardRestarts(manager).catch((e) => console.log(e));
  }
};

const startCheckForDeadShards = async (manager: ShardingManager) => {
  while (true) {
    await fct.sleep(CHECK_DEAD_SHARDS_INTERVAL);

    if (isProduction || process.env.USE_DEAD_SHARDS === 'true') {
      await checkForDeadShards(manager).catch((e) => console.log(e));
    }
  }
};

export default { start };
