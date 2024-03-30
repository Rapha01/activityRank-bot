import { publicIpv4 } from 'public-ip';
import managerDb from '../models/managerDb/managerDb.js';
import { escape } from 'mysql2/promise';
import type { Client, ShardingManager } from 'discord.js';

function _save(client: Client) {
  const obj = {
    shardId: client.shard!.ids[0],
    uptimeSeconds: Math.floor(client.uptime! / 1000),
    readyDate: client.readyTimestamp,
    serverCount: client.guilds.cache.size,
    status: client.ws.status,
    commandsTotal: client.botShardStat.commandsTotal,
    textMessagesTotal: client.botShardStat.textMessagesTotal,
  };
  return obj;
}

export default async (manager: ShardingManager) => {
  //logger.debug('Saving shard health');
  const round = Math.round;
  const nowDate = round(new Date().getTime() / 1000);
  const shards = await manager.broadcastEval(_save);

  let ip = await publicIpv4();

  const dataShards = shards.map((shard) => ({
    ...shard,
    ip,
    changedHealthDate: nowDate,
    readyDate: Math.round(new Date(shard.readyDate!).getTime() / 1000),
    shardId: process.env.NODE_ENV === 'production' ? shard.shardId : shard.shardId + 1000000,
  }));

  const keys = [
    'shardId',
    'status',
    'serverCount',
    'uptimeSeconds',
    'readyDate',
    'ip',
    'changedHealthDate',
    'commandsTotal',
    'textMessagesTotal',
  ] as const;

  const updateSqls = keys.map((k) => `${k}=VALUES(${k})`);

  const valueSqls = dataShards.map((s) => `(${keys.map((k) => escape(s[k])).join(',')})`);

  await managerDb.query(`INSERT INTO botShardStat (${keys.join(',')})
    VALUES ${valueSqls.join(',')} ON DUPLICATE KEY UPDATE ${updateSqls.join(',')}`);
};
