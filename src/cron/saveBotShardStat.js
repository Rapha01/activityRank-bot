const publicIp = require('public-ip');
const ipInt = require('ip-to-int');
const fctModel = require('../models/fctModel.js');

module.exports = (manager) => {
  return new Promise(async function (resolve, reject) {
    try {
      const nowDate = new Date().getTime() / 1000;

      const shards = await manager.broadcastEval(`
        const obj = {
          commands1h: this.appData.botShardStat.commands1h,
          botInvites1h: this.appData.botShardStat.botInvites1h,
          botKicks1h: this.appData.botShardStat.botKicks1h,
          voiceMinutes1h: this.appData.botShardStat.voiceMinutes1h,
          textMessages1h: this.appData.botShardStat.textMessages1h,
          roleAssignments1h: this.appData.botShardStat.roleAssignments1h,
          rolesDeassignments1h: this.appData.botShardStat.rolesDeassignments1h,
          serverCount: this.guilds.cache.size
        };
        this.appData.botShardStat = { commands1h: 0, botInvites1h: 0, botKicks1h: 0, voiceMinutes1h: 0, textMessages1h: 0, roleAssignments1h: 0, rolesDeassignments1h: 0 };
        obj;
		  `);

      for (shard of shards) {
        if (process.env.NODE_ENV != 'production')
          shard.shardId = shard.shardId + 1000000;
      }

      await fctModel.getInsertUpdateMultiSql('botShardStat',shards);

      resolve();
    } catch (e) { reject(e); }
  });
}
