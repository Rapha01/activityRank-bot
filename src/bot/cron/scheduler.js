const cron = require('node-cron');
const voiceXpRound = require('./voiceXpRound.js');
const resetJob = require('./resetJob.js');
const fct = require('../../util/fct.js');

if (process.env.NODE_ENV == 'production') {
  logHighestGuildsInterval = '0 */20 * * * *';
  voiceXpRoundInterval = 10000;
  resetJobInterval = 3000;
} else {
  logHighestGuildsInterval = '0 */2 * * * *';
  voiceXpRoundInterval = 10000;
  resetJobInterval = 3000;
}

exports.start = (client) => {
  // Loops
  startVoiceXp(client);
  startResetJob();

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


const startVoiceXp = async (client) => {
  while(true) {
    await voiceXpRound(client).catch(e => console.log(e));
    await fct.sleep(voiceXpRoundInterval).catch(e => console.log(e));
  }
}

const startResetJob = async () => {
  while(true) {
    await resetJob().catch(e => console.log(e));
    await fct.sleep(resetJobInterval).catch(e => console.log(e));
  }
}
