import publicIp from 'public-ip';
import managerDb from '../models/managerDb/managerDb.js';
import { escape } from 'promise-mysql';
import logger from '../util/logger.js';

function _save(client) {
  const obj = {
    shardId: client.shard.ids[0],
    uptimeSeconds: ~~(client.uptime / 1000),
    readyDate: client.readyTimestamp,
    serverCount: client.guilds.cache.size,
    status: client.ws.status,
    commandsTotal: client.appData.botShardStat.commandsTotal,
    textMessagesTotal: client.appData.botShardStat.textMessagesTotal,
  };
  return obj;
}

export default async (manager) => {
  //logger.debug('Saving shard health');
  const round = (n) => ~~n;
  const nowDate = round(new Date().getTime() / 1000);
  const shards = await manager.broadcastEval(_save);

  let ip = await publicIp.v4();

  for (const shard of shards) {
    shard.ip = ip;
    shard.changedHealthDate = nowDate;
    shard.readyDate = round(new Date(shard.readyDate).getTime() / 1000);

    if (process.env.NODE_ENV != 'production') shard.shardId = shard.shardId + 1000000;
  }

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
  ];

  const updateSqls = keys.map((k) => `${k}=VALUES(${k})`);

  const valueSqls = shards.map((s) => `(${keys.map((k) => escape(s[k])).join(',')})`);

  await managerDb.query(`INSERT INTO botShardStat (${keys.join(',')})
    VALUES ${valueSqls.join(',')} ON DUPLICATE KEY UPDATE ${updateSqls.join(',')}`);
};
