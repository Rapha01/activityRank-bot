const publicIp = require('public-ip');
const managerDb = require('../models/managerDb/managerDb.js');
const { escape } = require('promise-mysql');
const logger = require('../util/logger.js');


module.exports = async (manager) => {
  const res = await managerDb.query(`SELECT shardId from botShardStat WHERE restartQueued = 1`);

  shardIdsToRestart = [];
  for (let row of res) {
    const shard = manager.shards.find(shard => shard.id == row.shardId);
    if (shard)
      shardIdsToRestart.push(row.shardId);
  }

  logger.debug('Shards queued for restart: ' + (shardIdsToRestart.length == 0 ? 'None' : shardIdsToRestart.join(',')));

  if (shardIdsToRestart.length > 0)
    await managerDb.query(`UPDATE botShardStat SET restartQueued = 0 
        WHERE shardId IN (${shardIdsToRestart.join(',')}) `);
  
  for (let shardId of shardIdsToRestart) {
    const shard = manager.shards.find(shard => shard.id == shardId);
    if (shard)
      await shard.respawn();
  }  
};
