const resetModel = require('../models/resetModel.js');
const cron = require('node-cron');
const apiCaller = require('./apiCaller.js');


exports.start = (manager) => {
  return new Promise(async function (resolve, reject) {
    try {
      if (process.env.NODE_ENV == 'production') {
        // Reset daily/weekly/mothly/yearly stats
        cron.schedule('0 50 23 * * *', async function() {
          try {
            await resetModel.resetScoreByTime('day');
          } catch (e) { console.log(e); }
        });
        cron.schedule('0 53 23 * * 1', async function() {
          try {
            await resetModel.resetScoreByTime('week');
          } catch (e) { console.log(e); }
        });
        cron.schedule('0 56 23 1 * *', async function() {
          try {
            await resetModel.resetScoreByTime('month');
          } catch (e) { console.log(e); }
        });
        cron.schedule('0 59 23 1 1 *', async function() {
          try {
            await resetModel.resetScoreByTime('year');
          } catch (e) { console.log(e); }
        });

        // Send servercount to Discordbots.org
        cron.schedule('0 */23 * * * *', async function() {
            try {
              await apiCaller.sendServerCountToDiscordbotsOrg();
            } catch (e) { console.log(e); }
        });
      }

      resolve();
    } catch (e) { reject(e); }
  });
}
