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

function _updateSettings(client, { settings }) {client.appData.settings = settings}

const startUpdateSettings = async (manager) => {
  while(true) {
    try {
      let s = await settingModel.storage.get();
      s = JSON.stringify(s);
      // await manager.broadcastEval(`this.appData.settings = ${JSON.stringify(settings)}`);
      await manager.broadcastEval(_updateSettings, {context:{settings:s}});
    } catch (e) { console.log(e); }

    await fct.sleep(updateSettingsInterval).catch(e => console.log(e));
  }
}

function _updateTexts(client, { texts }) {client.appData.texts = texts}

const startUpdateTexts = async (manager) => {
  while(true) {
    try {
      let t = await textModel.storage.get();
      // t = JSON.stringify(t);
      // console.log(t)
      // await manager.broadcastEval((c,{t}) => c.appData.texts = t, { context: { t: t } } ); // `this.appData.texts = ${JSON.stringify(texts)}`);
      await manager.broadcastEval(_updateTexts, {context:{texts:t}})
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
