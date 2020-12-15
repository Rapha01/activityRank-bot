const Discord = require('discord.js');
const fct = require('../util/fct.js');
const guildModel = require('./models/guild/guildModel.js');
const cronScheduler = require('./cron/scheduler.js');
const settingModel = require('../models/managerDb/settingModel.js');
const textModel = require('../models/managerDb/textModel.js');
const rankVoiceMember = require('./util/rankVoiceMember.js');
const guildMemberModel = require('./models/guild/guildMemberModel.js');

const client = new Discord.Client(
  {ws: {intents:
  [ 'GUILDS',
    'GUILD_MEMBERS',
    'GUILD_MESSAGES',
    'GUILD_BANS',
    'GUILD_EMOJIS',
    'GUILD_INTEGRATIONS',
    'GUILD_WEBHOOKS',
    'GUILD_INVITES',
    'GUILD_VOICE_STATES',
    'GUILD_PRESENCES',
    'GUILD_MESSAGES',
    'GUILD_MESSAGE_REACTIONS',
    'GUILD_MESSAGE_TYPING',
    'DIRECT_MESSAGES',
    'DIRECT_MESSAGE_REACTIONS',
    'DIRECT_MESSAGE_TYPING'
  ]}}
);

process.env.UV_THREADPOOL_SIZE = 50;

const onMessage = require('./events/message.js');
const onGuildMemberAdd = require('./events/guildMemberAdd.js');
const onGuildCreate = require('./events/guildCreate.js');
const onGuildDelete = require('./events/guildDelete.js');
const onGuildMemberRemove = require('./events/guildMemberRemove.js');
const onMessageReactionAdd = require('./events/messageReactionAdd.js');

start();

async function start() {
  try {
    //await texter.initTexts();
    await initClientCaches(client);
    initEventTriggers(client);

    await client.login();
  } catch (e) {
    console.log(e);
    await fct.waitAndReboot(3000);
  }
}

function initEventTriggers(client) {
  client.on('ready', async () => {
    try {
      console.log(`Logged in as ${client.user.tag}!`);

      client.user.setActivity('Calculating..');

      await cronScheduler.start(client);

    } catch (e) { console.log(e); }
  });

  client.on('disconnect', (msg, code) => {
    if (code === 0)
      return console.log('client.onDisconnect: ',msg);

    client.connect();
  });

  client.on('error', (err) => {
    console.log('client.onError: ', err);
    //process.exit();
  });

  client.on('voiceStateUpdate', async (oldState, newState) => {
    try {
      if (oldState.member.user.bot) return;

      if (oldState.channel == null && newState.channel != null && newState.member != null) {
        await guildModel.cache.load(newState.guild);
        await guildMemberModel.cache.load(newState.member);
        await rankVoiceMember(newState.member,newState.channel);
      } /*else if (newState.channel == null && oldState.channel != null && oldState.member != null) {
        await guildModel.cache.load(oldState.guild);
        await guildMemberModel.cache.load(oldState.member);
        await rankVoiceMember(oldState.member,oldState.channel);
      }*/

    } catch (e) { console.log(e); }
  })

  client.on('message', (msg) => {onMessage(msg).catch(e => console.log(e));});
  client.on('guildCreate', (guild) => {onGuildCreate(guild).catch(e => console.log(e));});
  client.on('guildDelete', (guild) => {onGuildDelete(guild).catch(e => console.log(e));});
  client.on('guildMemberAdd', (member) => {onGuildMemberAdd(member).catch(e => console.log(e));});
  client.on('guildMemberRemove', (member) => {onGuildMemberRemove(member).catch(e => console.log(e));});
  client.on('messageReactionAdd', (member) => {onMessageReactionAdd(member).catch(e => console.log(e));});
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
