const localApi = require('../models/local/api.js');
const backupApi = require('../models/backup/api.js');
const tables = require('../models/local/tables.js');
let batchsize;

exports.start = () => {
  return new Promise(async function (resolve, reject) {
    try {
      console.log('Starting backup.');

      batchsize = 100;
      await sendRows('guild');
      batchsize = 3000;
      await sendRows('guildmember');
      await sendRows('guildchannel');
      await sendRows('guildrole');
      batchsize = 3000;
      await sendRows('textmessage');
      await sendRows('voiceminute');
      await sendRows('vote');
      await sendRows('bonus');
      await sendRows('command');

      console.log('Backup finished.');
      resolve();
    } catch (e) { reject(e); }
  });
}

function sendRows(tablename) {
  return new Promise(async function (resolve, reject) {
    try {
      let rows = await localApi.getUpdatedRows(tablename);
      await localApi.resetUpdatedRows(tablename);

      while (rows.length > 0) {
        await backupApi.setMulti(tablename,rows.splice(0,batchsize));
      }

      resolve();
    } catch (e) { reject(e); }
  });
}

function sendRows(tablename) {
  return new Promise(async function (resolve, reject) {
    try {
      let rows = await localApi.getUpdatedRows(tablename);
      await localApi.resetUpdatedRows(tablename);

      while (rows.length > 0) {
        await backupApi.setMulti(tablename,rows.splice(0,batchsize));
      }

      resolve();
    } catch (e) { reject(e); }
  });
}


const backupModel = require('../models/backupModel.js');
const config = require('../config.js');

let sleepTime;
if (process.env.NODE_ENV == 'production') {
  sleepTime = 60000;
  minDateChangedDiffMinutes = 10;
  maxDateBackedupDiffMinutes = 20;
} else {
  sleepTime = 10000;
  minDateChangedDiffMinutes = 1;
  maxDateBackedupDiffMinutes = 2;
}

exports.start2 = async () => {
  while (true) {
    await backup.backupIteration().catch(e => console.log(e));
    await fct.sleep(backupLoopSleepTime).catch(e => console.log(e));
  }
}

exports.backupIteration = () => {
  return new Promise(async function (resolve, reject) {
    try {
      console.log('Starting backup 2.');

      const gl_admin = await localApi.getSingle('gl_admin',{id:0});

      let rows = {},counts = {},finalRows = {},min,max;

      for (tablename in tables) {
        if (tables[tablename].type != 'settings' && tables[tablename].type != 'stats')
          continue;

        if (tables[tablename].priority <= 0) {
          min = minDateChangedDiffMinutes;
          max = maxDateBackedupDiffMinutes;
        } else {
          min = minDateChangedDiffMinutes * 3;
          max = maxDateBackedupDiffMinutes * 3;
        }

        rows[tablename] = await backupModel.getDueRows(tablename,
            min + min * gl_admin.backupmode,
            max + max * gl_admin.backupmode);
      }

      for (key in rows) counts[key] = rows[key].length;
      for (key in rows) finalRows[key] = [];

      while (JSON.stringify(finalRows).length < 30000 && !rowsEmpty(rows)) {
        for (key in rows) {
          if (rows[key].length == 0)
            continue;

          finalRows[key].push(rows[key].splice(0,tables[key].backupbatchsize));
        }
      }

      console.log('COUNTS: ',counts);
      console.log('FINAL ROWS: ',finalRows);

      // Clear rows in local db

      // Send to backupdb

      console.log('Backup 2 finished.');
      resolve();
    } catch (e) { reject(e); }
  });
}

function rowsEmpty(rows) {
  for (key in rows) if (rows[key].length > 0) return false;
  return true;
}
