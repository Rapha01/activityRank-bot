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

export async function resetScoreByTime(
  time: 'day' | 'week' | 'month' | 'year'
): Promise<{ errorCount: number }> {
  let errorCount = 0;
  console.log(`[reset] Resetting score (${time})`);

  console.log(`[reset] Resetting stats (${time})`);
  const statResult = await resetStatsByTime(time);
  errorCount += statResult.errorCount;

  console.log(`[reset] Resetting member scores (${time})`);
  const memResult = await resetMemberScoreByTime(time);
  errorCount += memResult.errorCount;

  return { errorCount };
}

async function resetStatsByTime(
  time: 'day' | 'week' | 'month' | 'year'
): Promise<{ errorCount: number }> {
  const dbShards = await queryManager<
    { host: string; id: number }[]
  >(`SELECT id,host FROM dbShard ORDER BY id ASC`);

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
                shard.host,
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
        `[reset] Reset stats by ${time} finished for DB ${shard.id} ${shard.host} after ${sec}s with ${errorCount} errors.`
      );
    } catch (e) {
      console.log(e);
    }
  }

  return { errorCount };
}

async function resetMemberScoreByTime(
  time: 'day' | 'week' | 'month' | 'year'
): Promise<{ errorCount: number }> {
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

      try {
        let min = BigInt(0);
        let max = increment;
        do {
          try {
            await queryShard(
              shard.host,
              `UPDATE guildMember ` +
                `INNER JOIN guild ON guildMember.guildId = guild.guildId ` +
                `SET ${time} = 0 ` +
                `WHERE (${time} != 0) ` +
                `AND (guildMember.guildId BETWEEN ${min} AND ${max}) ` +
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

      const sec = Math.ceil(process.hrtime(hrstart)[0]);
      console.log(
        `[reset] Reset member scores by ${time} finished for DB ${shard.id} ${shard.host} after ${sec}s with ${errorCount} errors.`
      );
    } catch (e) {
      console.log(e);
    }
  }

  return { errorCount };
}
