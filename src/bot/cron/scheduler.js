import cron from 'node-cron';
import voiceXpRound from './voiceXpRound.js';
import autoAssignPatreonRoles from './autoAssignPatreonRoles.js';
import resetJob from './resetJob.js';
import fct from '../../util/fct.js';
import config from '../../const/config.js';
import util from 'util';

const isProd = process.env.NODE_ENV === 'production';

const logShardDiagnostics = isProd ? '0 */10 * * * *' : '*/20 * * * * *';
const logHighestGuildsInterval = isProd ? '0 */20 * * * *' : '*/20 * * * * *';
const autoAssignPatreonRolesInterval = isProd ? '15 */15 * * * *' : '*/15 * * * * *';
const resetJobInterval = 3_000;

export const start = (client) => {
  // Loops
  startVoiceXp(client);
  startResetJob();

  /*
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
  */
  
  cron.schedule(logShardDiagnostics, async () => {
    try {
      let str = '';
      str += client.options.presence.status + ' ';
      str += client.options.ws.presence.status + ' ';
      str += client.ws.status + ' ';
      str += client.ws.destroyed + ' ';

      str += client.rest.requestManager.globalRemaining + ' ';
      str += client.rest.requestManager.hashTimer._destroyed + ' ';
      str += client.rest.requestManager.handlerTimer._destroyed + ' ';

      str += client.guilds.cache.size + ' ';
      str += client.presence.status + ' ';
      str += client.presence.clientStatus + ' ';

      str += JSON.stringify(util.inspect(client.sweepers.threads)) + ' ';

      str += client.appData.botShardStat.commandsTotal + ' ';
      str += client.appData.botShardStat.textMessagesTotal + ' ';

      //console.log(client);
      client.logger.debug('logShardDiagnostics: ' + str);
    } catch (e) {
      client.logger.warn(e, 'Error in logShardDiagnostics');
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
