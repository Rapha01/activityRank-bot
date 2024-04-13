import { DiscordSnowflake } from '@sapphire/snowflake';
import { queryManager } from './managerDb.js';
import { queryShard } from './shardDb.js';
import { isProduction } from '../const/keys.js';

const statsTables = [
  'textMessage',
  'voiceMinute',
  'vote',
  'bonus',
  'invite',
] as const;

const queryConstraints = (thisHour: number, thisDay: number) => ({
  day: `AND (guild.resetHour = ${thisHour})`,
  week: `AND (guild.resetDay = ${thisDay})`,
  month: `AND (guild.resetDay = ${thisDay})`,
  year: ``,
});

const hostField = isProduction ? 'hostIntern' : 'hostExtern';

export async function resetScoreByTime(
  time: 'day' | 'week' | 'month' | 'year'
) {
  console.log(`[reset] Resetting score (${time})`);
  const dbShards = await queryManager<
    { hostIntern: string; hostExtern: string; id: number }[]
  >(`SELECT * FROM dbShard ORDER BY id ASC`);

  let errorCount = 0;
  const currentSnowflake = DiscordSnowflake.generate();
  const increment = currentSnowflake / BigInt(50);

  for (let shard of dbShards) {
    try {
      const hrstart = process.hrtime();
      const extraConstraint = queryConstraints(
        new Date().getUTCHours(),
        new Date().getUTCDay()
      )[time];

      for (let statsTable of statsTables) {
        try {
          let min = BigInt(0);
          let max = increment;
          do {
            try {
              await queryShard(
                shard[hostField],
                `UPDATE ${statsTable} ` +
                  `INNER JOIN guild ON ${statsTable}.guildId = guild.guildId ` +
                  `SET ${time} = 0 ` +
                  `WHERE (${time} != 0) ` +
                  `AND (${statsTable}.guildId BETWEEN ${min} AND ${max}) ` +
                  extraConstraint
              );
            } catch (e) {
              errorCount++;
              console.log(e);
            } finally {
              min += increment;
              max += increment;
            }
          } while (min < currentSnowflake);
        } catch (e) {
          errorCount++;
          console.log(e);
        }
      }

      const sec = Math.ceil(process.hrtime(hrstart)[0]);
      console.log(
        `[reset] Reset Score by ${time} finished for DB ${shard.id} ${shard[hostField]} after ${sec}s with ${errorCount} errors.`
      );
    } catch (e) {
      console.log(e);
    }
  }

  return { errorCount };
}
