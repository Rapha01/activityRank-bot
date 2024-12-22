import { queryManager } from './managerDb.js';
import { getShardPool } from './shardDb.js';

type ResetPeriod = 'day' | 'week' | 'month' | 'year';

const statsTables = [
  'textMessage',
  'voiceMinute',
  'vote',
  'invite',
  'bonus',
] as const;

export async function runResetByTime(
  time: ResetPeriod
): Promise<{ errorCount: number }> {
  let errorCount = 0;
  console.log(`[reset] Resetting score (${time})`);

  console.log(`[reset] Resetting stats (${time})`);
  const statResult = await resetStatsByTime(time);
  errorCount += statResult.errorCount;

  console.log(`[reset] Resetting member scores (${time})`);
  const memResult = await resetMemberScoresByTime(time);
  errorCount += memResult.errorCount;

  return { errorCount };
}

async function resetStatsByTime(
  time: ResetPeriod
): Promise<{ errorCount: number }> {
  const dbShards = await queryManager<{ host: string; id: number }[]>(
    `SELECT id,host FROM dbShard ORDER BY id ASC`
  );

  const errors = [];
  for (const shard of dbShards) {
    const pool = getShardPool(shard.host);
    const hrstart = process.hrtime();

    for (let statsTable of statsTables) {
      // we paginate via cursor here to reduce the risk of page drift,
      // and to avoid the performance implications of OFFSET
      let highestGuildId = '0';
      let conn = null;
      try {
        while (true) {
          // the connection is reused for each stats table
          conn ??= await pool.getConnection();
          await conn.beginTransaction();
          // Find the guild ID 1000 guilds above the last guild.
          // Returns NULL (`null` in JS) if highestGuildId is the highest guild ID in the table
          // TODO: check that this returns correctly
          const [response] = await conn.query(
            `SELECT MAX(guildId) AS next_id FROM (SELECT guildId FROM guild WHERE guildId > ${highestGuildId} ORDER BY guildId ASC LIMIT 1000) AS \`table\``
          );
          // @ts-expect-error mysql2 typings are useless
          const nextGuildId = response[0].next_id as string | null;
          if (nextGuildId == null) {
            // completed
            conn.release();
            break;
          }
          await conn.query(
            `UPDATE ${statsTable} SET ${time} = 0 WHERE ${time} != 0 AND guildId BETWEEN ${highestGuildId} AND ${nextGuildId}`
          );
          await conn.commit();
          highestGuildId = nextGuildId;
        }
      } catch (error) {
        if (conn) await conn.rollback();
        errors.push(error);
      } finally {
        if (conn) conn.release();
      }
    }

    const sec = Math.ceil(process.hrtime(hrstart)[0]);
    console.log(
      `[reset] Reset stats by ${time} finished for DB ${shard.id} ${shard.host} after ${sec}s with ${errors.length} errors.`
    );
    console.log(errors);
  }

  return { errorCount: errors.length };
}

async function resetMemberScoresByTime(
  time: ResetPeriod
): Promise<{ errorCount: number }> {
  const dbShards = await queryManager<{ host: string; id: number }[]>(
    `SELECT id,host FROM dbShard ORDER BY id ASC`
  );

  const errors = [];
  for (const shard of dbShards) {
    const pool = getShardPool(shard.host);
    const hrstart = process.hrtime();

    // we paginate via cursor here to reduce the risk of page drift,
    // and to avoid the performance implications of OFFSET
    let highestGuildId = '0';
    let conn = null;
    try {
      while (true) {
        conn ??= await pool.getConnection();
        await conn.beginTransaction();
        // Find the guild ID 1000 guilds above the last guild.
        // Returns NULL (`null` in JS) if highestGuildId is the highest guild ID in the table
        const [response] = await conn.query(
          `SELECT MAX(guildId) AS next_id FROM (SELECT guildId FROM guild WHERE guildId > ${highestGuildId} ORDER BY guildId ASC LIMIT 1000) AS \`table\``
        );
        // @ts-ignore mysql2 typings are useless
        const nextGuildId = response[0].next_id as string | null;
        if (nextGuildId == null) {
          // completed
          conn.release();
          break;
        }
        await conn.query(
          `UPDATE guildMember SET ${time} = 0 WHERE ${time} != 0 AND guildId BETWEEN ${highestGuildId} AND ${nextGuildId}`
        );
        await conn.commit();
        highestGuildId = nextGuildId;
      }
    } catch (error) {
      if (conn) await conn.rollback();
      errors.push(error);
    } finally {
      if (conn) conn.release();
    }

    const sec = Math.ceil(process.hrtime(hrstart)[0]);
    console.log(
      `[reset] Reset scores by ${time} finished for DB ${shard.id} ${shard.host} after ${sec}s with ${errors.length} errors.`
    );
    console.log(errors);
  }

  return { errorCount: errors.length };
}
