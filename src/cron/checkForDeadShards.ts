import publicIp from 'public-ip';
import managerDb from '../models/managerDb/managerDb.js';
import logger from '../util/logger.js';

function _getStats(client) {
  const obj = {
    shardId: client.shard.ids[0],
    commandsTotal: client.appData.botShardStat.commandsTotal,
    textMessagesTotal: client.appData.botShardStat.textMessagesTotal,
  };
  return obj;
}

function compare(a, b) {
  if (a.timestamp > b.timestamp) {
    return -1;
  }
  if (a.timestamp < b.timestamp) {
    return 1;
  }
  return 0;
}

const secondsDead = process.env.NODE_ENV == 'production' ? 3600 : 30;
let history = [];

export default async (manager) => {
  const timestamp = Math.round(Date.now() / 1000);
  const shards = await manager.broadcastEval(_getStats);

  history.push({ timestamp, shards });

  // Pick setOld: latest set that is older than secondsDead
  const setOld = history.filter((set) => set.timestamp < timestamp - secondsDead).reverse()[0];

  if (!setOld) return;

  // Clean unused old sets from history
  history = history.filter((set) => set.timestamp >= setOld.timestamp);

  // Pick setNow: latest set added just now to history
  const setNow = history[history.length - 1];

  // Compare setNow with setOld
  const deadShardIds = [];
  for (const shardOld of setOld.shards) {
    const shardNow = setNow.shards.find((s) => s.shardId == shardOld.shardId);
    if (!shardNow) continue;

    const diff =
      shardOld.textMessagesTotal +
      shardOld.commandsTotal -
      shardNow.textMessagesTotal -
      shardNow.commandsTotal;

    if (diff == 0) deadShardIds.push(shardOld.shardId);
  }

  if (deadShardIds.length == 0) return;

  logger.debug(
    'Shard(s) ' +
      deadShardIds.join(', ') +
      ' dead (no commands or messages registered for ' +
      secondsDead / 60 +
      'm). Restarting..',
  );

  for (const shardId of deadShardIds) {
    const shard = manager.shards.find((shard) => shard.id == shardId);
    if (shard) await shard.respawn();
  }
};
