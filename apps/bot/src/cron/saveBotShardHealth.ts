import { publicIpv4 } from 'public-ip';
import { manager } from '../models/managerDb/managerDb.js';
import type { Client, ShardingManager } from 'discord.js';
import { isProduction } from '#const/config.js';
import { sql, type Expression } from 'kysely';

function _save(client: Client) {
  if (!client.shard || client.shard.ids.length < 1) {
    throw new Error('Saving shard health of unshareded client');
  }

  const obj = {
    shardId: client.shard.ids[0],
    uptimeSeconds: Math.floor(client.uptime ?? 0 / 1000),
    readyDate: client.readyTimestamp,
    serverCount: client.guilds.cache.size,
    status: client.ws.status,
    commandsTotal: client.botShardStat.commandsTotal,
    textMessagesTotal: client.botShardStat.textMessagesTotal,
  };
  return obj;
}

export default async (shardManager: ShardingManager) => {
  //logger.debug('Saving shard health');
  const round = Math.round;
  const nowDate = round(new Date().getTime() / 1000);
  const shards = await shardManager.broadcastEval(_save);

  const ip = await publicIpv4();

  const dataShards = shards.map((shard) => ({
    ...shard,
    ip,
    changedHealthDate: nowDate,
    readyDate: Math.round(new Date(shard.readyDate ?? 0).getTime() / 1000),
    shardId: isProduction ? shard.shardId : shard.shardId + 1000000,
  }));

  function values<T>(expr: Expression<T>) {
    return sql<T>`VALUES(${expr})`;
  }

  await manager.db
    .insertInto('botShardStat')
    .values(dataShards)
    .onDuplicateKeyUpdate((eb) => ({
      shardId: values(eb.ref('shardId')),
      status: values(eb.ref('status')),
      serverCount: values(eb.ref('serverCount')),
      uptimeSeconds: values(eb.ref('uptimeSeconds')),
      readyDate: values(eb.ref('readyDate')),
      ip: values(eb.ref('ip')),
      changedHealthDate: values(eb.ref('changedHealthDate')),
      commandsTotal: values(eb.ref('commandsTotal')),
      textMessagesTotal: values(eb.ref('textMessagesTotal')),
    }))
    .executeTakeFirstOrThrow();
};
