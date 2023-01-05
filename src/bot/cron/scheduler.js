const cron = require('node-cron');
const voiceXpRound = require('./voiceXpRound.js');
const autoAssignPatreonRoles = require('./autoAssignPatreonRoles.js');
const resetJob = require('./resetJob.js');
const fct = require('../../util/fct.js');
const config = require('../../const/config.js');

const isProd = process.env.NODE_ENV === 'production';

const logHighestGuildsInterval = isProd ? '0 */20 * * * *' : '*/20 * * * * *';
const autoAssignPatreonRolesInterval = isProd ? '15 */15 * * * *' : '*/15 * * * * *';
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
    } catch (e) {
      client.logger.warn(e, 'Error in highestGuilds');
    }
  });

  const supportGuild = client.guilds.cache.get(config.supportServerId);
  if (supportGuild) {
    cron.schedule(autoAssignPatreonRolesInterval, async () => {
      try {
        await autoAssignPatreonRoles(supportGuild);
         
        client.logger.info('Updated support server Patreon roles');
      } catch (e) {
        client.logger.warn(e, 'Error in autoAssignPatreonRoles');
      }
    });
  }
};

const startVoiceXp = async (client) => {
  while (true) {
    await voiceXpRound(client).catch((e) =>
      client.logger.warn(e, 'Error in voiceXpRound')
    );
  }
};

const startResetJob = async () => {
  while (true) {
    await resetJob().catch((e) => client.logger.warn(e, 'Error in resetJob'));
    await fct
      .sleep(resetJobInterval)
      .catch((e) =>
        client.logger.warn(e, 'Error sleeping in resetJob interval')
      );
  }
};
