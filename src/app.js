const scheduler = require('./cron/scheduler.js');
const fct = require('./util/fct.js');
const config = require('./const/config.js');
const keys = require('./const/keys.js').get();
//const updateGl = require('./cron/updateGl.js');

if(!process.env.NODE_ENV || process.env.NODE_ENV != 'production')
  process.env.NODE_ENV = 'development';

const managerOptions = {
  token: keys.botAuth,
  // shardList: Array.from(Array(20).keys()),
  // totalShards: 20
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
      await manager.spawn('auto',5500,60000);

      await scheduler.start(manager);
      resolve();
    } catch (e) { return reject(e); }
  });
}

// Process Exit
process.on('SIGINT', () => {
  console.info('SIGINT signal received in Manager..');
});

process.on('SIGTERM', () => {
  console.info('SIGTERM signal received in Manager.');
});
