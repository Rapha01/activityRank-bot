const cron = require('node-cron');
const handoutVoiceminutes = require('./handoutVoiceminutes.js');
const doResetJob = require('./doResetJob.js');
//const texter = require('../texter.js');

if (process.env.NODE_ENV == 'production') {
  logHighestGuildsInterval = '0 */20 * * * *';
} else {
  logHighestGuildsInterval = '0 */2 * * * *';
}

exports.start = (client) => {
  // Loops
  handoutVoiceminutes.start(client);
  doResetJob.start();

  cron.schedule(logHighestGuildsInterval, async function() {
    try {
      const maxGuilds = client.guilds.cache.sort(
          (a, b) => (a.memberCount < b.memberCount) ? 1 : -1)
          .array().slice(0,20);

      let str = '';
      for (let maxGuild of maxGuilds)
        str += maxGuild.memberCount + ' ' + maxGuild.name + ' \n';

      console.log('maxGuilds for shard ' + client.shard.ids[0] + ' \n' + str);
    } catch (e) { console.log(e); }
  });
}
