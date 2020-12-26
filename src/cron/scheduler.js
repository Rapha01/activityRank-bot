const cron = require('node-cron');
const saveBotShardHealth = require('./saveBotShardHealth.js');
const fct = require('../util/fct.js');
const statFlush = require('../models/shardDb/statFlush.js');
const settingModel = require('../models/managerDb/settingModel.js');
const textModel = require('../models/managerDb/textModel.js');

let backupDelay,updateDelay,restartDelay,
    cronBackupInterval,cronUpdateInterval,saveShardStatsInterval;

if (process.env.NODE_ENV == 'production') {
  restartDelay = 86400000 * 7;
  statFlushCacheInterval = 15000;
  updateSettingsInterval = 300000;
  updateTextsInterval = 300000;
  saveBotShardHealthInterval = 180000;
  statFlushCacheCronInterval = '30 * * * * *';
} else {
  restartDelay = 86400000;
  statFlushCacheInterval = 5000;
  updateSettingsInterval = 10000;
  updateTextsInterval = 10000;
  saveBotShardHealthInterval = 8000;
  statFlushCacheCronInterval = '*/10 * * * * *';
}

exports.start = (manager) => {
  return new Promise(async function (resolve, reject) {
    try {
      //startStatFlush(manager);
      startUpdateSettings(manager);
      startUpdateTexts(manager);
      startSaveBotShardHealth(manager);

      // Periodical Restart
      setTimeout(function() {
        try {
          process.exit();
        } catch (e) { console.log(e); }
      }, restartDelay);

      cron.schedule(statFlushCacheCronInterval, async function() {
        try {
          await statFlush(manager);
        } catch (e) { console.log(e); }
      });

      resolve();
    } catch (e) { reject(e); }
  });
}

/*
const startStatFlush = async (manager) => {
  while(true) {
    await statFlush(manager).catch(e => console.log(e));
    await fct.sleep(statFlushCacheInterval).catch(e => console.log(e));
  }
}*/

const startUpdateSettings = async (manager) => {
  while(true) {
    try {
      const settings = await settingModel.storage.get();
      await manager.broadcastEval(`this.appData.settings = ${JSON.stringify(settings)}`);
    } catch (e) { console.log(e); }

    await fct.sleep(updateSettingsInterval).catch(e => console.log(e));
  }
}

const startUpdateTexts = async (manager) => {
  while(true) {
    try {
      const texts = await textModel.storage.get();
      await manager.broadcastEval(`this.appData.texts = ${JSON.stringify(texts)}`);
    } catch (e) { console.log(e); }

    await fct.sleep(updateTextsInterval).catch(e => console.log(e));
  }
}

const startSaveBotShardHealth = async (manager) => {
  while(true) {
    await saveBotShardHealth(manager).catch(e => console.log(e));
    await fct.sleep(saveBotShardHealthInterval).catch(e => console.log(e));
  }
}
