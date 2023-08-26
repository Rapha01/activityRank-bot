import { Client, Options, GatewayIntentBits } from 'discord.js';
import fct from '../util/fct.js';
import settingModel from '../models/managerDb/settingModel.js';
import textModel from '../models/managerDb/textModel.js';
import load from './util/startup/index.js';
import loggerManager from './util/logger.js';
import globalLogger from '../util/logger.js';
import cronScheduler from './cron/scheduler.js';

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
  ...Options.defaultSweeperSettings,
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

    client.logger = loggerManager.init(client.shard.ids);
    client.logger.info('Logged in');
    
    try {
      load(client);
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

async function initClientCaches(client) {
  client.appData = {};
  client.appData.statFlushCache = {};
  client.appData.botShardStat = {
    commandsTotal: 0,
    textMessagesTotal: 0,
  };
  await textModel.cache.load(client);
  await settingModel.cache.load(client);
}

process.on('SIGINT', () => {
  globalLogger.warn('SIGINT signal received in Shard.');
  process.exit();
});

process.on('SIGTERM', () => {
  globalLogger.warn('SIGTERM signal received in Shard.');
  process.exit();
});
