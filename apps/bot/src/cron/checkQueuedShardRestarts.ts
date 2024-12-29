import { getManagerDb } from '../models/managerDb/managerDb.js';
import logger from '../util/logger.js';
import type { ShardingManager } from 'discord.js';

export default async (manager: ShardingManager) => {
  const db = getManagerDb();

  const res = await db
    .selectFrom('botShardStat')
    .select('shardId')
    .where('restartQueued', '=', 1)
    .execute();

  const shardIdsToRestart = res
    .map(({ shardId }) => shardId)
    .filter((shardId) => manager.shards.has(shardId));

  logger.debug(
    `Shards queued for restart: ${
      shardIdsToRestart.length === 0 ? 'None' : shardIdsToRestart.join(', ')
    }`,
  );

  if (shardIdsToRestart.length > 0)
    await db
      .updateTable('botShardStat')
      .set({ restartQueued: 0 })
      .where('shardId', 'in', shardIdsToRestart)
      .executeTakeFirstOrThrow();

  for (const shardId of shardIdsToRestart) {
    const shard = manager.shards.get(shardId);
    if (shard) await shard.respawn();
  }
};
