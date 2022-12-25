const cron = require('node-cron');
const voiceXpRound = require('./voiceXpRound.js');
const resetJob = require('./resetJob.js');
const fct = require('../../util/fct.js');

const isProd = process.env.NODE_ENV === 'production';

const logHighestGuildsInterval = isProd ? '0 */20 * * * *' : '*/20 * * * * *';
const resetJobInterval = 3_000;

exports.start = (client) => {
  // Loops
  startVoiceXp(client);
  startResetJob();

  cron.schedule(logHighestGuildsInterval, async () => {
    try {
      const sort = client.guilds.cache
        .sort((a, b) => (a.memberCount < b.memberCount ? 1 : -1))
        .first(20);

      let str = '';
      for (let a of sort)
        str += `${a.memberCount.toLocaleString().padEnd(9)} | ${a.name}\n`;

      client.logger.info('High-member count guilds:\n' + str);

      // console.log(`maxGuilds for shard ${client.shard.ids[0]}\n${str}`);
    } catch (e) {
      client.warn(e, 'Error in highestGuilds');
    }
  });
};

const startVoiceXp = async (client) => {
  while (true) {
    await voiceXpRound(client).catch((e) => console.log(e));
  }
};

const startResetJob = async () => {
  while (true) {
    await resetJob().catch((e) => console.log(e));
    await fct.sleep(resetJobInterval).catch((e) => console.log(e));
  }
};
