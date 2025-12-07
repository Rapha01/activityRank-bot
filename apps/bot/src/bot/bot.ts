import { Time } from '@sapphire/duration';
import {
  ActivityType,
  Client,
  type ClientOptions,
  GatewayIntentBits,
  type GuildMember,
  Options,
  Partials,
} from 'discord.js';
import invariant from 'tiny-invariant';
import { keys } from '#const/config.ts';
import { updateTexts } from '#models/managerDb/textModel.ts';
import fct from '../util/fct.ts';
import globalLogger from '../util/logger.ts';
import { memberCache } from './models/guild/guildMemberModel.ts';
import { ensureI18nLoaded } from './util/i18n.ts';
import loggerManager from './util/logger.ts';
import { registry } from './util/registry/registry.ts';

/**
 * Decide whether or not a member should be kept cached.
 * @param member the member to check if it will be kept cached
 * @returns whether the member needs to remain cached.
 */
function keepMemberCached(member: GuildMember): boolean {
  if (member.id === member.client.user.id) return true; // keep own client cached
  if (member.voice.channelId !== null) return true; // keep users in voice cached so they can be counted

  const lastVoteDate = memberCache.get(member)?.cache.lastVoteDate;
  // Keep users that have voted in the last week so that they can't vote multiple times.
  // We don't check how long the guild's vote timeout is here, or even whether the guild permits votes,
  // because it would slow down the bot too much and the memory optimisation would be negligible at that point.
  if (lastVoteDate && lastVoteDate.getTime() > Date.now() - Time.Week) return true;
  return false;
}

const clientOptions: ClientOptions = {
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
  ],
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
  makeCache: Options.cacheWithLimits({
    ...Options.DefaultMakeCacheSettings,
    ApplicationCommandManager: 0,
    AutoModerationRuleManager: 0,
    BaseGuildEmojiManager: 0,
    DMMessageManager: 0,
    GuildBanManager: 0,
    GuildEmojiManager: 0,
    GuildInviteManager: 0,
    PresenceManager: 0,
    GuildScheduledEventManager: 0,
    GuildStickerManager: 0,
    ReactionManager: 0,
    ReactionUserManager: 0,
    GuildMemberManager: { maxSize: 200, keepOverLimit: keepMemberCached },
  }),
  sweepers: {
    ...Options.DefaultSweeperSettings,
    users: {
      interval: 3_600, // Every hour.
      filter: () => (user) => user.bot && user.id !== user.client.user.id, // Remove all bots.
    },
  },
  // Message and Reaction partials are required to listen for reactions on uncached messages (for reactionVotes).
  partials: [Partials.Message, Partials.Reaction],
};

if (keys.proxy) {
  clientOptions.rest = { api: keys.proxy };
}

const client = new Client(clientOptions);

// Adjusts number of threads allocated by libuv
// @ts-expect-error process.env only expects string values
process.env.UV_THREADPOOL_SIZE = 50;

start();

async function start() {
  try {
    // see https://github.com/discordjs/discord.js/blob/14.25.1/packages/discord.js/src/sharding/Shard.js#L69
    invariant(process.env.SHARDS, 'SHARDS should always be set by the Discord.JS sharding manager');
    const shardId = parseInt(process.env.SHARDS);
    invariant(Number.isSafeInteger(shardId), 'SHARDS should always be a single integer');
    client.logger = loggerManager.init(shardId);
    client.logger.info('Initialising...');

    await ensureI18nLoaded();
    await initClientCaches(client);

    client.logger.info('Loading pieces...');

    await registry.loadEvents();
    client.logger.info(`Loaded ${registry.events.size} events`);
    registry.attachEvents(client);

    await registry.loadCommands();
    client.logger.info(`Loaded ${registry.commands.size} commands`);

    client.logger.info('Logging in...');
    await client.login();
    client.logger.info('Initialized');
  } catch (e) {
    globalLogger.error(e, 'Error while launching shard');
    await fct.sleep(500);
    process.exit();
  }
}

async function initClientCaches(client: Client) {
  // statFlushCache cannot be a Map because it's fetched by the manager
  // (which only accepts JSON-serializable objects)
  client.statFlushCache = {};
  client.xpFlushCache = {};
  client.botShardStat = { commandsTotal: 0, textMessagesTotal: 0 };
  await updateTexts();
}

process.on('SIGINT', () => {
  globalLogger.warn('SIGINT signal received in Shard.');
  process.exit();
});

process.on('SIGTERM', () => {
  globalLogger.warn('SIGTERM signal received in Shard.');
  process.exit();
});
