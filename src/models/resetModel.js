const shardDb = require('./shardDb.js');
const managerDb = require('./managerDb.js');

const statsTables = ['textMessage','voiceMinute','vote','bonus','invite'];

const hostField = process.env.NODE_ENV == 'production' ? 'hostIntern' : 'hostExtern';

exports.resetScoreByTime = (time) => {
  return new Promise(async function (resolve, reject) {

      const dbShards = await managerDb.query(`SELECT * FROM dbShard ORDER BY id ASC`);
      let errors = 0;

      for (let shard of dbShards) {
        try {
          hrstart = process.hrtime();

          for (let statsTable of statsTables) {
            try {
              await shardDb.query(shard[hostField],`UPDATE ${statsTable} SET ${time} = 0 WHERE ${time} != 0 `);
            } catch (e) {
              errors++;
              console.log(e);
            }

          }

          sec =  Math.ceil(process.hrtime(hrstart)[0]);
          console.log(`Reset Score by ${time} finished for DB ${shard.id} ${shard[hostField]} after ${sec}s with ${errors} errors.`)
        } catch (e) { console.log(e); }
      }

      resolve();
  });
}
