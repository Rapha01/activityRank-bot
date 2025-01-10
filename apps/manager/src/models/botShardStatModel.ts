import { manager } from './managerDb.js';

export async function getShardServerCounts() {
  const results = await manager.db
    .selectFrom('botShardStat')
    .select('serverCount')
    .where('shardId', '<', 1_000_000)
    .execute();

  return results.map((res) => res.serverCount);
}

interface ShardStats {
  shardId: number;
  status: number;
  serverCount: number;
  uptimeSeconds: number;
  readyDate: number;
  ip: number;
  changedHealthDate: number;
}

export async function getShardStats() {
  return await manager.db
    .selectFrom('botShardStat')
    .select([
      'shardId',
      'status',
      'serverCount',
      'uptimeSeconds',
      'readyDate',
      'ip',
      'changedHealthDate',
    ])
    .where('shardId', '<', 1_000_000)
    .execute();
}

/** Get the IPs of all shards. */
export async function getShardIps() {
  const res = await manager.db.selectFrom('botShardStat').select('ip').execute();
  const ips = res.map(({ ip }) => ip);
  return Array.from(new Set(ips));
}
