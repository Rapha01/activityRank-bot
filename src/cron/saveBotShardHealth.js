const publicIp = require('public-ip');
const managerDb = require('../models/managerDb/managerDb.js');
const { escape } = require('promise-mysql');

function _save(client) {
  const obj = {
    shardId: client.shard.ids[0],
    uptimeSeconds: ~~(client.uptime / 1000),
    readyDate: client.readyTimestamp,
    serverCount: client.guilds.cache.size,
    status: client.ws.status,
  };
  return obj;
}

module.exports = async (manager) => {
  console.log('Saving shard health');
  const round = (n) => ~~n;
  const nowDate = round(new Date().getTime() / 1000);
  const shards = await manager.broadcastEval(_save);

  let ip = await publicIp.v4();

  for (const shard of shards) {
    shard.ip = ip;
    shard.changedHealthDate = nowDate;
    shard.readyDate = round(new Date(shard.readyDate).getTime() / 1000);

    if (process.env.NODE_ENV != 'production')
      shard.shardId = shard.shardId + 1000000;
  }

  const keys = [
    'shardId',
    'status',
    'serverCount',
    'uptimeSeconds',
    'readyDate',
    'ip',
    'changedHealthDate',
  ];

  const updateSqls = keys.map((k) => `${k}=VALUES(${k})`);

  const valueSqls = shards.map(
    (s) => `(${keys.map((k) => escape(s[k])).join(',')})`
  );

  await managerDb.query(`INSERT INTO botShardStat (${keys.join(',')})
    VALUES ${valueSqls.join(',')} ON DUPLICATE KEY UPDATE ${updateSqls.join(
    ','
  )}`);
};
