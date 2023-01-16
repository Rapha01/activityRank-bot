const shardDb = require('./shardDb.js');
const managerDb = require('./managerDb.js');
const { DiscordSnowflake } = require('@sapphire/snowflake');

const statsTables = ['textMessage','voiceMinute','vote','bonus','invite'];

const queryConstraints = (thisHour, thisDay) => ({
  day: `AND (guild.resetHour = ${thisHour})`, 
  week: `AND (guild.resetDay = ${thisDay})`, 
  month: `AND (guild.resetDay = ${thisDay})`, 
  year: ``,
})

const hostField = process.env.NODE_ENV == 'production' ? 'hostIntern' : 'hostExtern';

module.exports.resetScoreByTime = async function (time) {
  const dbShards = await managerDb.query(`SELECT * FROM dbShard ORDER BY id ASC`);
  let errorCount = 0;
  const currentSnowflake = DiscordSnowflake.generate();
  const increment = currentSnowflake / 50n;

  for (let shard of dbShards) {
    try {
      hrstart = process.hrtime();
      const extraConstraint = queryConstraints(new Date().getUTCHours(), new Date().getUTCDay())[time]

      for (let statsTable of statsTables) {
        try {
          let min = 0n;
          let max = increment;
          do {
            try {
              await shardDb.query(shard[hostField], 
                `UPDATE ${statsTable} `
                + `INNER JOIN guild ON ${statsTable}.guildId = guild.guildId `
                + `SET ${time} = 0 `
                + `WHERE (${time} != 0) `
                + `AND (${statsTable}.guildId BETWEEN ${min} AND ${max}) `
                + extraConstraint
                )
            } catch (e) {
              errorCount++;
              console.log(e);
            } finally {
              min += increment;
              max += increment;
            }
          } while (min < currentSnowflake)
        } catch (e) {
          errorCount++;
          console.log(e);
        }
      }

      sec =  Math.ceil(process.hrtime(hrstart)[0]);
      console.log(`Reset Score by ${time} finished for DB ${shard.id} ${shard[hostField]} after ${sec}s with ${errors} errors.`)
    } catch (e) { console.log(e); }
  }

}
