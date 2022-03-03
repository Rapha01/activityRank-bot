const shardDb = require('./shardDb.js');
const managerDb = require('./managerDb.js');

const statsTables = ['textMessage','voiceMinute','vote','bonus','invite'];

const hostField = process.env.NODE_ENV == 'production' ? 'hostIntern' : 'hostExtern';

exports.resetScoreByTime = (time) => {
  return new Promise(async function (resolve, reject) {

      const dbShards = await managerDb.query(`SELECT * FROM dbShard ORDER BY id ASC`);

      for (let shard of dbShards) {
        try {
          hrstart = process.hrtime();

          for (let statsTable of statsTables)
            await shardDb.query(shard[hostField],`UPDATE ${statsTable} SET ${time} = 0 WHERE ${time} != 0 `);

          sec =  Math.ceil(process.hrtime(hrstart)[0]);
          console.log('resetScoreBy ' + time + ' finished for DB ' + shard.id + ' ' + shard[hostField] + ' after ' + sec + 's.');
        } catch (e) { console.log(e); }
      }

      resolve();
  });
}
