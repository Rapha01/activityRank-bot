import type { ShardingManager } from 'discord.js';
import { manager } from '../models/managerDb/managerDb.js';
import logger from '../util/logger.js';

export default async (shardManager: ShardingManager) => {
  const res = await manager.db
    .selectFrom('botShardStat')
    .select('shardId')
    .where('restartQueued', '=', 1)
    .execute();

  const shardIdsToRestart = res
    .map(({ shardId }) => shardId)
    .filter((shardId) => shardManager.shards.has(shardId));

  logger.debug(
    `Shards queued for restart: ${
      shardIdsToRestart.length === 0 ? 'None' : shardIdsToRestart.join(', ')
    }`,
  );

  if (shardIdsToRestart.length > 0)
    await manager.db
      .updateTable('botShardStat')
      .set({ restartQueued: 0 })
      .where('shardId', 'in', shardIdsToRestart)
      .executeTakeFirstOrThrow();

  for (const shardId of shardIdsToRestart) {
    const shard = shardManager.shards.get(shardId);
    if (shard) await shard.respawn();
  }
};
