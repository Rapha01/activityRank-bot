const scheduler = require('./cron/scheduler.js');
const fct = require('./util/fct.js');
const config = require('./const/config.js');
const keys = require('./const/keys.js');
//const updateGl = require('./cron/updateGl.js');

if(!process.env.NODE_ENV || process.env.NODE_ENV != 'production')
  process.env.NODE_ENV = 'development';

let managerOptions;
if (process.env.NODE_ENV == 'production') {
  managerOptions = {
  	token: keys.production.botAuth,
    //shardList: Array.from(Array(20).keys()),
    totalShards: 'auto',
    respawn: true
  }
} else {
  managerOptions = {
  	token: keys.development.botAuth,
    totalShards: 'auto',
    respawn: true
  }
}

const Discord = require('discord.js');
const manager = new Discord.ShardingManager('./bot/bot.js', managerOptions);

start().catch(async (e) => {
  console.log(e);
  await fct.waitAndReboot(3000);
});

async function start() {
  return new Promise(async function (resolve, reject) {
    try {

      await manager.spawn('auto',10000,60000);

      await scheduler.start(manager);
      resolve();
    } catch (e) { return reject(e); }
  });
}

/*
manager.on('shardCreate', async (shard) => {
  try {

    shard.on('ready', async (client) => { shard.eval(`this.appData = {}; this.appData.settings = ${'null'}; this.appData.texts = ${'null'};`); });

  } catch (e) { console.log(e); }
});*/

// Process Exit
process.on('SIGINT', () => {
  console.info('SIGINT signal received in Manager..');
});

process.on('SIGTERM', () => {
  console.info('SIGTERM signal received in Manager.');
});
