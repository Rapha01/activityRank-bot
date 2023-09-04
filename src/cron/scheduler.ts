import cron from 'node-cron';
import saveBotShardHealth from './saveBotShardHealth.js';
import fct from '../util/fct.js';
import statFlush from '../models/shardDb/statFlush.js';
import settingModel from '../models/managerDb/settingModel.js';
import textModel from '../models/managerDb/textModel.js';
import checkQueuedShardRestarts from './checkQueuedShardRestarts.js';
import checkForDeadShards from './checkForDeadShards.js';
import type { Client, ShardingManager } from 'discord.js';

const isProd = process.env.NODE_ENV == 'production';
const settings = {
  restartDelay: isProd ? 86_400_000 * 7 : 86_400_000,
  // statFlushCacheInterval: isProd ? 15_000 : 5_000,
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

  // Periodical Restart
  setTimeout(() => {
    try {
      process.exit();
    } catch (e) {
      console.log(e);
    }
  }, settings.restartDelay);

  cron.schedule(settings.statFlushCacheCronInterval, async () => {
    try {
      await statFlush(manager);
    } catch (e) {
      console.log(e);
    }
  });
}

/*
const startStatFlush = async (manager) => {
  while(true) {
    await statFlush(manager).catch(e => console.log(e));
    await fct.sleep(statFlushCacheInterval).catch(e => console.log(e));
  }
}*/

function _updateSettings(client: Client, { settings }) {
  client.appData.settings = settings;
}

const startUpdateSettings = async (manager: ShardingManager) => {
  while (true) {
    try {
      const settings = await settingModel.storage.get();
      await manager.broadcastEval(_updateSettings, {
        context: { settings: JSON.stringify(settings) },
      });
    } catch (e) {
      console.log(e);
    }

    await fct.sleep(settings.updateSettingsInterval).catch((e) => console.log(e));
  }
};

function _updateTexts(client: Client, { texts }) {
  client.appData.texts = texts;
}

const startUpdateTexts = async (manager: ShardingManager) => {
  while (true) {
    try {
      let t = await textModel.storage.get();
      // t = JSON.stringify(t);
      // console.log(t)
      // await manager.broadcastEval((c,{t}) => c.appData.texts = t, { context: { t: t } } ); // `this.appData.texts = ${JSON.stringify(texts)}`);
      await manager.broadcastEval(_updateTexts, { context: { texts: t } });
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
