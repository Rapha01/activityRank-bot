import { Client, Options, GatewayIntentBits, Events } from 'discord.js';
import fct from '../util/fct.js';
import loggerManager from './util/logger.js';
import globalLogger from '../util/logger.js';
import { loadCommandFiles } from './util/commandLoader.js';
import { loadEventFiles, loadEvents } from './util/eventLoader.js';
import { ActivityType } from 'discord.js';
import { updateTexts } from 'models/managerDb/textModel.js';
import { updateSettings } from 'models/managerDb/settingModel.js';

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

const client = new Client({
  intents,
  presence: {
    activities: [
      {
        type: ActivityType.Custom,
        // `state` is what actually gets displayed;
        // `name` is still required but not shown
        state: 'Calculating..',
        name: 'Calculating..',
      },
    ],
  },
});

// Adjusts number of threads allocated by libuv
// @ts-expect-error process.env only expects string values
process.env.UV_THREADPOOL_SIZE = 50;

start();

async function start() {
  try {
    client.logger = loggerManager.init(client.shard!.ids);
    client.logger.info('Initialising...');

    await initClientCaches(client);

    try {
      client.logger.info('Loading pieces...');
      await loadCommandFiles();
      await loadEventFiles();
      loadEvents(client);
      client.logger.info('Pieces loaded');
    } catch (e) {
      client.logger.warn(e, 'Error while loading in shard');
      await fct.waitAndReboot(3_000);
    }

    client.logger.info('Logging in...');

    await client.login();

    client.logger.info('Initialized');
  } catch (e) {
    globalLogger.warn(e, 'Error while launching shard');
    await fct.waitAndReboot(3_000);
  }
}

async function initClientCaches(client: Client) {
  // statFlushCache cannot be a Map because it's fetched by the manager
  // (which only accepts JSON-serializable objects)
  client.statFlushCache = {};
  client.botShardStat = { commandsTotal: 0, textMessagesTotal: 0 };
  await updateTexts();
  await updateSettings();
}

process.on('SIGINT', () => {
  globalLogger.warn('SIGINT signal received in Shard.');
  process.exit();
});

process.on('SIGTERM', () => {
  globalLogger.warn('SIGTERM signal received in Shard.');
  process.exit();
});
