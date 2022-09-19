const shardDb = require('./shardDb.js');
const managerDb = require('./managerDb.js');

const statsTables = ['textMessage','voiceMinute','vote','bonus','invite'];

const hostField = process.env.NODE_ENV == 'production' ? 'hostIntern' : 'hostExtern';

exports.resetScoreByTime = (time) => {
  return new Promise(async function (resolve, reject) {

      const dbShards = await managerDb.query(`SELECT * FROM dbShard ORDER BY id ASC`);
      let errors = 0;
      const currentSnowflake = ((BigInt(Date.now()) - 1420070400000n) << 22n) | ((0n & 0b11111n) << 17n) | ((1n & 0b11111n) << 12n) | 1n;
      // gets the current Discord snowflake. 
      // Credit: https://github.com/sapphiredev/utilities/blob/78a79ca21b48cfe21003332d74aaa94db066dc25/packages/snowflake/src/lib/Snowflake.ts#L76
      const increment = currentSnowflake / 100n;

      for (let shard of dbShards) {
        try {
          hrstart = process.hrtime();

          for (let statsTable of statsTables) {
            try {
              let min = 0;
              let max = increment;
              do {
                try {
                  await shardDb.query(shard[hostField],`UPDATE ${statsTable} SET ${time} = 0 WHERE ${time} != 0 AND id BETWEEN ${min} AND ${max}`);
                } catch (e) {
                  errors++;
                  console.log(e);
                }
              } while (min < currentSnowflake)
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
