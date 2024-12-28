import { queryManager } from './managerDb.js';

export async function getShardServerCounts() {
  const results = await queryManager<{ serverCount: number }[]>(
    `SELECT serverCount FROM botShardStat WHERE shardId < 1000000`
  );

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
  return await queryManager<ShardStats[]>(
    `SELECT shardId, status, serverCount, uptimeSeconds, readyDate, ip, changedHealthDate
    FROM botShardStat WHERE shardId < 1000000`
  );
}

/** Get the IPs of all shards. */
export async function getShardIps() {
  const res = await queryManager<{ ip: string }[]>(
    'SELECT ip FROM botShardStat'
  );
  const ips = res.map(({ ip }) => ip);
  return Array.from(new Set(ips));
}
