const cron = require('node-cron');
const saveBotShardHealth = require('./saveBotShardHealth.js');
const fct = require('../util/fct.js');
const statFlush = require('../models/shardDb/statFlush.js');
const settingModel = require('../models/managerDb/settingModel.js');
const textModel = require('../models/managerDb/textModel.js');
const checkQueuedShardRestarts = require('./checkQueuedShardRestarts.js');
const checkForDeadShards = require('./checkForDeadShards.js');


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

exports.start = (manager) => {
  return new Promise(async function (resolve, reject) {
    try {
      //startStatFlush(manager);
      startUpdateSettings(manager);
      startUpdateTexts(manager);
      startSaveBotShardHealth(manager);
      startCheckForDeadShards(manager);

      if (isProd)
        startCheckQueuedShardRestarts(manager);

      // Periodical Restart
      setTimeout(function () {
        try {
          process.exit();
        } catch (e) {
          console.log(e);
        }
      }, settings.restartDelay);

      cron.schedule(settings.statFlushCacheCronInterval, async function () {
        try {
          await statFlush(manager);
        } catch (e) {
          console.log(e);
        }
      });

      resolve();
    } catch (e) {
      reject(e);
    }
  });
};

/*
const startStatFlush = async (manager) => {
  while(true) {
    await statFlush(manager).catch(e => console.log(e));
    await fct.sleep(statFlushCacheInterval).catch(e => console.log(e));
  }
}*/

function _updateSettings(client, { settings }) {
  client.appData.settings = settings;
}

const startUpdateSettings = async (manager) => {
  while (true) {
    try {
      let s = await settingModel.storage.get();
      s = JSON.stringify(s);
      // await manager.broadcastEval(`this.appData.settings = ${JSON.stringify(settings)}`);
      await manager.broadcastEval(_updateSettings, {
        context: { settings: s },
      });
    } catch (e) {
      console.log(e);
    }

    await fct
      .sleep(settings.updateSettingsInterval)
      .catch((e) => console.log(e));
  }
};

function _updateTexts(client, { texts }) {
  client.appData.texts = texts;
}

const startUpdateTexts = async (manager) => {
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

const startSaveBotShardHealth = async (manager) => {
  while (true) {
    await saveBotShardHealth(manager).catch((e) => console.log(e));
    await fct
      .sleep(settings.saveBotShardHealthInterval)
      .catch((e) => console.log(e));
  }
};

const startCheckQueuedShardRestarts = async (manager) => {
  while (true) {
    await fct
      .sleep(settings.checkQueuedShardRestartsInterval)
      .catch((e) => console.log(e));
    
    await checkQueuedShardRestarts(manager).catch((e) => console.log(e));
  }
};

const startCheckForDeadShards = async (manager) => {
  while (true) {
    await fct
      .sleep(settings.checkForDeadShardsInterval)
      .catch((e) => console.log(e));
    
    await checkForDeadShards(manager).catch((e) => console.log(e));
  }
};