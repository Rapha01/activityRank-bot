import type { Client, ShardingManager } from 'discord.js';
import logger from '../util/logger.js';

function _getStats(client: Client) {
  const obj = {
    shardId: client.shard!.ids[0],
    commandsTotal: client.appData.botShardStat.commandsTotal,
    textMessagesTotal: client.appData.botShardStat.textMessagesTotal,
  };
  return obj;
}

const secondsDead = process.env.NODE_ENV == 'production' ? 3600 : 30;
interface HistoryEntry {
  timestamp: number;
  shards: ReturnType<typeof _getStats>[];
}
let history: HistoryEntry[] = [];

export default async (manager: ShardingManager) => {
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
    `Shard(s) ${deadShardIds.join(', ')} dead (no commands or messages registered for ${
      secondsDead / 60
    }m). Restarting..`,
  );

  for (const shardId of deadShardIds) {
    const shard = manager.shards.find((shard) => shard.id == shardId);
    if (shard) await shard.respawn();
  }
};
