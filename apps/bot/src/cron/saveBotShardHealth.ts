import { networkInterfaces } from 'node:os';
import type { Client, ShardingManager } from 'discord.js';
import { type Expression, sql } from 'kysely';
import { publicIpv4 } from 'public-ip';
import { exposedPort, isProduction } from '#const/config.ts';
import { manager } from '../models/managerDb/managerDb.ts';

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
  const nowDate = Math.round(Date.now() / 1000);
  const shards = await shardManager.broadcastEval(_save);

  const ip = isProduction ? await publicIpv4() : privateIpv4();

  const dataShards = shards.map((shard) => ({
    ...shard,
    ip: `${ip}:${exposedPort}`,
    changedHealthDate: nowDate,
    readyDate: Math.round(new Date(shard.readyDate ?? 0).getTime() / 1000),
    shardId: shard.shardId,
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

function privateIpv4(): string {
  for (const addressList of Object.values(networkInterfaces())) {
    const address = addressList?.find((address) => address.family === 'IPv4' && !address.internal);
    if (address) {
      return address.address;
    }
  }
  throw new Error('Failed to find a non-loopback private IP address.');
}
