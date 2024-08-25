import cron from 'node-cron';
import saveBotShardHealth from './saveBotShardHealth.js';
import fct from '../util/fct.js';
import statFlush from '../models/shardDb/statFlush.js';
import checkQueuedShardRestarts from './checkQueuedShardRestarts.js';
import checkForDeadShards from './checkForDeadShards.js';
import type { ShardingManager } from 'discord.js';
import { updateTexts } from 'models/managerDb/textModel.js';
import { updateSettings } from 'models/managerDb/settingModel.js';

const isProd = process.env.NODE_ENV == 'production';
// TODO: represent with Time.*
const settings = {
  updateSettingsInterval: isProd ? 300_000 : 10_000,
  updateTextsInterval: isProd ? 300_000 : 10_000,
  saveBotShardHealthInterval: isProd ? 180_000 : 8_000,
  statFlushCacheCronInterval: isProd ? '30 * * * * *' : '*/10 * * * * *',
  checkQueuedShardRestartsInterval: isProd ? 120_000 : 30_000,
  checkForDeadShardsInterval: isProd ? 1200_000 : 10_000,
};

export async function start(manager: ShardingManager) {
  //startStatFlush(manager);
  startUpdateSettings(manager);
  startUpdateTexts(manager);
  startSaveBotShardHealth(manager);
  startCheckForDeadShards(manager);

  if (isProd) startCheckQueuedShardRestarts(manager);

  cron.schedule(settings.statFlushCacheCronInterval, async () => {
    try {
      await statFlush(manager);
    } catch (e) {
      console.log(e);
    }
  });
}

const startUpdateSettings = async (manager: ShardingManager) => {
  while (true) {
    try {
      await updateSettings();
    } catch (e) {
      console.log(e);
    }

    await fct.sleep(settings.updateSettingsInterval).catch((e) => console.log(e));
  }
};

const startUpdateTexts = async (manager: ShardingManager) => {
  while (true) {
    try {
      await updateTexts();
    } catch (e) {
      console.log(e);
    }

    await fct.sleep(settings.updateTextsInterval).catch((e) => console.log(e));
  }
};

const startSaveBotShardHealth = async (manager: ShardingManager) => {
  while (true) {
    await saveBotShardHealth(manager).catch((e) => console.log(e));
    await fct.sleep(settings.saveBotShardHealthInterval).catch((e) => console.log(e));
  }
};

const startCheckQueuedShardRestarts = async (manager: ShardingManager) => {
  while (true) {
    await fct.sleep(settings.checkQueuedShardRestartsInterval).catch((e) => console.log(e));

    await checkQueuedShardRestarts(manager).catch((e) => console.log(e));
  }
};

const startCheckForDeadShards = async (manager: ShardingManager) => {
  while (true) {
    await fct.sleep(settings.checkForDeadShardsInterval).catch((e) => console.log(e));

    if (isProd || process.env.USE_DEAD_SHARDS)
      await checkForDeadShards(manager).catch((e) => console.log(e));
  }
};

export default { start };
