import { Client, Options, GatewayIntentBits } from 'discord.js';
import fct from '../util/fct.js';
import settingModel from '../models/managerDb/settingModel.js';
import textModel from '../models/managerDb/textModel.js';
import loggerManager from './util/logger.js';
import globalLogger from '../util/logger.js';
import loadEvents from './util/startup/eventLoader.js';
import { loadCommandFiles } from './util/commandLoader.js';

const intents = [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMembers,
  // FLAGS.GUILD_BANS,
  // FLAGS.GUILD_EMOJIS_AND_STICKERS,
  GatewayIntentBits.GuildIntegrations,
  // FLAGS.GUILD_WEBHOOKS,
  GatewayIntentBits.GuildVoiceStates,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.GuildMessageReactions,
  // FLAGS.GUILD_MESSAGE_TYPING,
  // FLAGS.DIRECT_MESSAGES,
  // FLAGS.DIRECT_MESSAGE_REACTIONS,
  // FLAGS.DIRECT_MESSAGE_TYPING,
];

const sweepers = {
  ...Options.DefaultSweeperSettings,
  messages: {
    interval: 300, // 5m
    lifetime: 600, // 10m
  },
  invites: {
    interval: 300, // 5m
    lifetime: 600, // 10m
  },
};

const client = new Client({ intents });

process.env.UV_THREADPOOL_SIZE = 50;

start();

async function start() {
  try {
    await initClientCaches(client);

    await client.login();

    client.logger = loggerManager.init(client.shard!.ids);
    client.logger.info('Logged in');

    try {
      await loadCommandFiles();
      await loadEvents(client);
    } catch (e) {
      client.logger.warn(e, 'Error while loading in shard');
      await fct.waitAndReboot(3_000);
    }

    client.logger.info('Initialized');
  } catch (e) {
    globalLogger.warn(e, 'Error while launching shard');
    await fct.waitAndReboot(3_000);
  }
}

async function initClientCaches(client: Client) {
  client.appData = {
    statFlushCache: {},
    botShardStat: {
      commandsTotal: 0,
      textMessagesTotal: 0,
    },
    texts: await textModel.storage.get(),
    settings: await settingModel.storage.get(),
  };
}

process.on('SIGINT', () => {
  globalLogger.warn('SIGINT signal received in Shard.');
  process.exit();
});

process.on('SIGTERM', () => {
  globalLogger.warn('SIGTERM signal received in Shard.');
  process.exit();
});
