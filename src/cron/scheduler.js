const resetModel = require('../models/resetModel.js');
const cron = require('node-cron');
const topgg_api = require('../util/topgg_api.js');
const patreon_api = require('../util/patreon_api.js');

// should never trigger because Docker defaults to UTC
if (new Date().getTimezoneOffset() !== 0)
  console.warn(`\n\n\n!!!\nThe current timezone is off from UTC by ${new Date().getTimezoneOffset() / 60} hours.
This may affect the expected reset time.\n!!!\n\n\n`)

exports.start = (manager) => {
  return new Promise(async function (resolve, reject) {
    try {
      if (process.env.NODE_ENV == 'production') {
        // Reset daily/weekly/monthly/yearly stats
        cron.schedule('5 * * * *', async function() {
          try {
            await resetModel.resetScoreByTime('day');
          } catch (e) { console.log(e); }
        });
        cron.schedule('20 23 * * *', async function() {
          try {
            await resetModel.resetScoreByTime('week');
          } catch (e) { console.log(e); }
        });
        cron.schedule('30 23 1-7 * *', async function() {
          try {
            await resetModel.resetScoreByTime('month');
          } catch (e) { console.log(e); }
        });
        cron.schedule('45 23 1 1 *', async function() {
          try {
            await resetModel.resetScoreByTime('year');
          } catch (e) { console.log(e); }
        });
        // Send servercount to Discordbots.org
        cron.schedule('*/23 * * * *', async function() {
            try {
              await topgg_api.sendServerCountToDiscordbotsOrg();
            } catch (e) { console.log(e); }
        });
        // Update patrons
        cron.schedule('*/6 * * * *', async function() {
          try {
            await patreon_api.updatePatrons();
          } catch (e) { console.log(e); }
        });
      }
      await patreon_api.updatePatrons();
      resolve();
    } catch (e) { reject(e); }
  });
}
