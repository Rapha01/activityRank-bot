import managerDb from '../models/managerDb/managerDb.js';
import logger from '../util/logger.js';
import type { ShardingManager } from 'discord.js';

export default async (manager: ShardingManager) => {
  const res = await managerDb.query<{ shardId: number }[]>(
    `SELECT shardId from botShardStat WHERE restartQueued = 1`,
  );

  const shardIdsToRestart: number[] = [];
  for (let row of res) {
    const shard = manager.shards.find((shard) => shard.id == row.shardId);
    if (shard) shardIdsToRestart.push(row.shardId);
  }

  logger.debug(
    `Shards queued for restart: ${
      shardIdsToRestart.length === 0 ? 'None' : shardIdsToRestart.join(',')
    }`,
  );

  if (shardIdsToRestart.length > 0)
    await managerDb.query(`UPDATE botShardStat SET restartQueued = 0 
        WHERE shardId IN (${shardIdsToRestart.join(',')}) `);

  for (let shardId of shardIdsToRestart) {
    const shard = manager.shards.find((shard) => shard.id == shardId);
    if (shard) await shard.respawn();
  }
};
