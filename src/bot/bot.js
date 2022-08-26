const fs = require('fs');
const path = require('path');
const { Client, Options, GatewayIntentBits } = require('discord.js');
const fct = require('../util/fct.js');
const settingModel = require('../models/managerDb/settingModel.js');
const textModel = require('../models/managerDb/textModel.js');
const loadCommands = require('./util/cmdLoader');

const intents = [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMembers,
  // FLAGS.GUILD_BANS,
  // FLAGS.GUILD_EMOJIS_AND_STICKERS,
  GatewayIntentBits.GuildIntegrations,
  // FLAGS.GUILD_WEBHOOKS,
  GatewayIntentBits.GuildVoiceStates,
  GatewayIntentBits.GuildMessages,
  // todo: rm? ^^
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

    await loadCommands(client);

    await client.login();
  } catch (e) {
    console.log(e);
    await fct.waitAndReboot(3000);
  }
}

const eventFiles = fs.readdirSync(path.resolve(__dirname, './events')).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const event = require(`./events/${file}`);
  if (event.once) {
    client.once(event.name, async (...args) => {
      try {
        await event.execute(...args);
      } catch (e) { console.log(e); }
    });
  } else {
    client.on(event.name, async (...args) => {
      try {
        await event.execute(...args);
      } catch (e) { console.log(e); }
    });
  }
}

function initClientCaches(client) {
  return new Promise(async function(resolve, reject) {
    try {
      client.appData = {};
      client.appData.statFlushCache = {};
      client.appData.botShardStat = { commands1h: 0, botInvites1h: 0, botKicks1h: 0, voiceMinutes1h: 0, textMessages1h: 0, roleAssignments1h: 0, rolesDeassignments1h: 0 };
      await textModel.cache.load(client);
      await settingModel.cache.load(client);

      resolve();
    } catch (e) { return reject(e); }
  });
}

process.on('SIGINT', () => {
  console.info('SIGINT signal received in Shard.');
});

process.on('SIGTERM', () => {
  console.info('SIGTERM signal received in Shard.');
});
