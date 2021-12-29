const fs = require('fs');
const path = require('path');
const { Client, Collection, Intents } = require('discord.js');
const { botAuth } = require('../const/keys.js')
const fct = require('../util/fct.js');
const cronScheduler = require('./cron/scheduler.js');
const settingModel = require('../models/managerDb/settingModel.js');
const textModel = require('../models/managerDb/textModel.js');
const deploy = {
    local: require('./interactionDeployment/deploy-local.js'),
    global: require('./interactionDeployment/deploy-global.js')
}

const flags = Intents.FLAGS
const intents = [
    flags.GUILDS,
    flags.GUILD_MEMBERS, // !!! PRIVILEGED !!!
    flags.GUILD_BANS,
    flags.GUILD_EMOJIS_AND_STICKERS,
    flags.GUILD_INTEGRATIONS,
    flags.GUILD_WEBHOOKS,
    flags.GUILD_VOICE_STATES,
    flags.GUILD_MESSAGES,
    flags.GUILD_MESSAGE_REACTIONS,
    flags.GUILD_MESSAGE_TYPING,
    flags.DIRECT_MESSAGES,
    flags.DIRECT_MESSAGE_REACTIONS,
    flags.DIRECT_MESSAGE_TYPING
]

const client = new Client({ intents: intents });

async function beginDeploy() {
    if (process.env.NODE_ENV == 'production')
        await deploy.global();
    else
        await deploy.local();
}
beginDeploy();

client.commands = new Collection();


let files = [];

function getRecursive(dir) {
    fs.readdirSync(dir).forEach(file => {
        const absolute = path.join(dir, file);
        if (fs.statSync(absolute).isDirectory()) 
            return getRecursive(absolute);
        return files.push(absolute);
    });
}

getRecursive(path.resolve(__dirname, './commandsSlash'));

files = files.map(fileName => fileName.replace(__dirname, '.'));

files.forEach(fileName => {
    const command = require(fileName);
    client.commands.set(fileName, command);
});

console.log('✅ Commands Loaded ✅');


process.env.UV_THREADPOOL_SIZE = 50;


start();

async function start() {
    try {
        //await texter.initTexts();
        await initClientCaches(client);

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
