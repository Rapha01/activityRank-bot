import { Cron } from 'croner';
import type { Client } from 'discord.js';
import { config } from '#const/config.js';
import autoAssignPatreonRoles from './autoAssignPatreonRoles.js';
import voiceXpRound from './voiceXpRound.js';

const isProd = process.env.NODE_ENV === 'production';

const LOG_SHARD_DIAGNOSTICS_CRON = isProd ? '0 */10 * * * *' : '*/20 * * * * *';
const logHighestGuildsInterval = isProd ? '0 */20 * * * *' : '*/20 * * * * *';
const ASSIGN_PATREON_ROLES_CRON = isProd ? '15 */15 * * * *' : '*/15 * * * * *';

export const start = (client: Client) => {
  // Loops
  startVoiceXp(client);

  new Cron(LOG_SHARD_DIAGNOSTICS_CRON, async () => {
    try {
      const attrs = {
        presenceStatus: client.options.presence?.status,
        wsStatus: client.ws.status,
        // biome-ignore lint/complexity/useLiteralKeys: required to access private field
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
    new Cron(ASSIGN_PATREON_ROLES_CRON, async () => {
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

export default { start };
