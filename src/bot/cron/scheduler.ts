import cron from 'node-cron';
import voiceXpRound from './voiceXpRound.js';
import autoAssignPatreonRoles from './autoAssignPatreonRoles.js';
import resetJob from './resetJob.js';
import fct from '../../util/fct.js';
import util from 'util';
import type { Client } from 'discord.js';
import { config } from 'const/config.js';

const isProd = process.env.NODE_ENV === 'production';

const logShardDiagnostics = isProd ? '0 */10 * * * *' : '*/20 * * * * *';
const logHighestGuildsInterval = isProd ? '0 */20 * * * *' : '*/20 * * * * *';
const autoAssignPatreonRolesInterval = isProd ? '15 */15 * * * *' : '*/15 * * * * *';
const resetJobInterval = 3_000;

export const start = (client: Client) => {
  // Loops
  startVoiceXp(client);
  startResetJob(client);

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
      const attrs = {
        presenceStatus: client.options.presence?.status,
        wsStatus: client.ws.status,
        wsDestroyed: client.ws['destroyed'],
        remainingRequests: client.rest.globalRemaining,
        cachedGuilds: client.guilds.cache.size,
        commandsTotal: client.botShardStat.commandsTotal,
        msgsTotal: client.botShardStat.textMessagesTotal,
      };
      /* 
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

      str += client.botShardStat.commandsTotal + ' ';
      str += client.botShardStat.textMessagesTotal + ' '; 
      */

      client.logger.debug({ attrs }, 'Shard diagnostics');
    } catch (e) {
      client.logger.warn(e, 'Error in shard diagnostics');
    }
  });

  const supportGuild = client.guilds.cache.get(config.supportServer.id);
  if (supportGuild && !config.disablePatreon) {
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

const startVoiceXp = async (client: Client) => {
  while (true) {
    await voiceXpRound(client).catch((e) => client.logger.warn(e, 'Error in voiceXpRound'));
  }
};

const startResetJob = async (client: Client) => {
  while (true) {
    await resetJob().catch((e) => client.logger.warn(e, 'Error in resetJob'));
    await fct
      .sleep(resetJobInterval)
      .catch((e) => client.logger.warn(e, 'Error sleeping in resetJob interval'));
  }
};

export default { start };
