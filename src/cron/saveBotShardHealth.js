const publicIp = require('public-ip');
const ipInt = require('ip-to-int');
const fctModel = require('../models/fctModel.js');

function _save(client) {
  const obj = {
    shardId: client.shard.ids[0],
    uptimeSeconds: client.uptime / 1000,
    readyDate: client.readyTimestamp,
    serverCount: client.guilds.cache.size
  }
  return obj
}

module.exports = (manager) => {
  return new Promise(async function (resolve, reject) {
    try {
      const nowDate = new Date().getTime() / 1000;
      const shards = await manager.broadcastEval(_save)
      /* const shards = await manager.broadcastEval(`
        const obj = {
          shardId: this.shard.ids[0],
          uptimeSeconds: this.uptime / 1000,
          readyDate: this.readyTimestamp,
          serverCount: this.guilds.cache.size
        };
        obj;
		  `); */

      let ip = await publicIp.v4();
      ip = ipInt(ip).toInt();

      for (const shard of shards) {
        // console.log(shard);
        shard.ip = ip;
        shard.changedHealthDate = nowDate;
        shard.readyDate = new Date(shard.readyDate).getTime() / 1000;
        if (process.env.NODE_ENV != 'production')
          shard.shardId = shard.shardId + 1000000;
      }

      await fctModel.insertUpdateMulti('botShardStat',shards);

      resolve();
    } catch (e) { reject(e); }
  });
}
