const fs = require('fs');
const path = require('path');
const { Client, Intents: { FLAGS } } = require('discord.js');
const fct = require('../util/fct.js');
const settingModel = require('../models/managerDb/settingModel.js');
const textModel = require('../models/managerDb/textModel.js');
const loadCommands = require('./util/cmdLoader');

const intents = [
  FLAGS.GUILDS,
  FLAGS.GUILD_MEMBERS,
  // FLAGS.GUILD_BANS,
  // FLAGS.GUILD_EMOJIS_AND_STICKERS,
  FLAGS.GUILD_INTEGRATIONS,
  // FLAGS.GUILD_WEBHOOKS,
  FLAGS.GUILD_VOICE_STATES,
  FLAGS.GUILD_MESSAGES,
  FLAGS.GUILD_MESSAGE_REACTIONS,
  // FLAGS.GUILD_MESSAGE_TYPING,
  // FLAGS.DIRECT_MESSAGES,
  // FLAGS.DIRECT_MESSAGE_REACTIONS,
  // FLAGS.DIRECT_MESSAGE_TYPING,
];

const sweepers = {
  messages: {
    interval: 43200, // 12h
    lifetime: 21600, // 6h
  },
  threads: {
    interval: 43200, // 12h
    lifetime: 21600, // 6h
  },
  invites: {
    interval: 43200, // 12h
    lifetime: 21600, // 6h
  },
};

const client = new Client({ intents, sweepers });
require('discord-modals')(client);


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
  return new Promise(async function (resolve, reject) {
    try {
      client.appData = {};
      client.appData.statFlushCache = {};
      client.appData.botShardStat = { commands1h: 0, botInvites1h: 0, botKicks1h: 0, voiceMinutes1h: 0, textMessages1h: 0, roleAssignments1h: 0, rolesDeassignments1h: 0 };
      textModel.cache.load(client);
      settingModel.cache.load(client);

      resolve();
    } catch (e) { console.log(e); }
  });
}

process.on('SIGINT', () => {
  console.info('SIGINT signal received in Shard.');
});

process.on('SIGTERM', () => {
  console.info('SIGTERM signal received in Shard.');
});
