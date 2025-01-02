import shardDb from './shardDb.js';
import logger from '../../util/logger.js';
import type { ShardingManager } from 'discord.js';
import type {
  StatFlushCache,
  StatFlushCacheChannelEntry,
  StatFlushCacheGuildEntry,
} from '#bot/statFlushCache.js';
import type { StatType } from '#models/types/enums.js';
import { inspect } from 'node:util';
import type { XpFlushCache } from '#bot/xpFlushCache.js';

export default async function (manager: ShardingManager) {
  const shardCaches = (await manager.fetchClientValues('statFlushCache')) as Record<
    string,
    StatFlushCache
  >[];
  manager.broadcastEval((client) => {
    client.statFlushCache = {};
  });

  const xpCaches = (await manager.fetchClientValues('xpFlushCache')) as Record<
    string,
    XpFlushCache
  >[];
  manager.broadcastEval((client) => {
    client.xpFlushCache = {};
  });

  await runStatFlush(shardCaches);
  await runXpFlush(xpCaches);
}

async function runStatFlush(caches: Record<string, StatFlushCache>[]) {
  const hrstart = process.hrtime();

  const statFlushCache = combineShardCaches(caches);

  const promises = [];
  const counts: { [k in keyof StatFlushCache]?: number } = {};

  for (const dbHost in statFlushCache) {
    for (const _type in statFlushCache[dbHost]) {
      const type = _type as StatType;
      const count = Object.keys(statFlushCache[dbHost][type]).length;
      if (count < 1) continue;

      promises.push(shardDb.query(dbHost, getSql(type, statFlushCache[dbHost][type])));
      if (counts[type]) {
        counts[type] += count;
      } else {
        counts[type] = count;
      }
    }
  }

  await Promise.all(promises);

  const hrend = process.hrtime(hrstart);
  logger.info(`Stat flush finished after ${hrend}s. Saved rows: ${inspect(counts)}`);
}

async function runXpFlush(caches: Record<string, XpFlushCache>[]) {
  const hrstart = process.hrtime();

  const flushCache = combineXpCaches(caches);

  const promises = [];
  let count = 0;

  for (const dbHost in flushCache) {
    const length = Object.keys(flushCache[dbHost]).length;
    if (length < 1) continue;

    promises.push(shardDb.query(dbHost, getXpSql(flushCache[dbHost])));

    count += length;
  }

  await Promise.all(promises);

  const hrend = process.hrtime(hrstart);
  logger.info(`XP flush finished after ${hrend}s. Saved rows: ${count}`);
}

const combineShardCaches = (shardCaches: Record<string, StatFlushCache>[]) => {
  const statFlushCache: Record<string, StatFlushCache> = {};

  for (const shard of shardCaches) {
    for (const dbHost in shard) {
      if (!statFlushCache[dbHost]) statFlushCache[dbHost] = {} as StatFlushCache;

      for (const type in shard[dbHost]) {
        if (!statFlushCache[dbHost][type as StatType])
          statFlushCache[dbHost][type as StatType] = {};

        // @ts-expect-error See above; needs cleanup
        statFlushCache[dbHost][type as StatType] = {
          ...statFlushCache[dbHost][type as StatType],
          ...shard[dbHost][type as StatType],
        };
      }
    }
  }

  return statFlushCache;
};
const combineXpCaches = (shardCaches: Record<string, XpFlushCache>[]) => {
  const flushCache: Record<string, XpFlushCache> = {};

  for (const shard of shardCaches) {
    for (const dbHost in shard) {
      flushCache[dbHost] = { ...flushCache[dbHost], ...shard[dbHost] };
    }
  }

  return flushCache;
};

// 100,000,000 (this amount of XP is > level 1500 so should be inconsequential)
const MAX_STAT_COLUMN_VALUE = 100000000;

const getSql = <T extends StatType>(
  type: T,
  entries: T extends 'textMessage' | 'voiceMinute'
    ? Record<string, StatFlushCacheChannelEntry>
    : Record<string, StatFlushCacheGuildEntry>,
) => {
  const sqls = [];
  const now = Math.floor(new Date().getTime() / 1000);

  if (type === 'textMessage' || type === 'voiceMinute') {
    for (const entry in entries)
      sqls.push(`(${entries[entry].guildId},${entries[entry].userId},${
        (entries[entry] as StatFlushCacheChannelEntry).channelId
      },
          LEAST(${MAX_STAT_COLUMN_VALUE},${entries[entry].count}),LEAST(${MAX_STAT_COLUMN_VALUE},${entries[entry].count}),
          LEAST(${MAX_STAT_COLUMN_VALUE},${entries[entry].count}),LEAST(${MAX_STAT_COLUMN_VALUE},${
            entries[entry].count
          }),LEAST(${MAX_STAT_COLUMN_VALUE},${entries[entry].count}),${now},${now})`);

    return `
        INSERT INTO ${type} (guildId,userId,channelId,alltime,year,month,week,day,changeDate,addDate)
        VALUES ${sqls.join(',')}
        ON DUPLICATE KEY UPDATE
        guildId = VALUES(guildId),
        userId = VALUES(userId),
        channelId = VALUES(channelId),
        alltime = LEAST(${MAX_STAT_COLUMN_VALUE},alltime + VALUES(alltime)),
        year = LEAST(${MAX_STAT_COLUMN_VALUE},year + VALUES(year)),
        month = LEAST(${MAX_STAT_COLUMN_VALUE},month + VALUES(month)),
        week = LEAST(${MAX_STAT_COLUMN_VALUE},week + VALUES(week)),
        day = LEAST(${MAX_STAT_COLUMN_VALUE},day + VALUES(day)),
        changeDate = VALUES(changeDate);
    `;
  }
  if (type === 'invite' || type === 'vote' || type === 'bonus') {
    for (const entry in entries)
      sqls.push(`(${entries[entry].guildId},${entries[entry].userId},
          LEAST(${MAX_STAT_COLUMN_VALUE},${entries[entry].count}),LEAST(${MAX_STAT_COLUMN_VALUE},${entries[entry].count}),LEAST(${MAX_STAT_COLUMN_VALUE},${entries[entry].count}),
          LEAST(${MAX_STAT_COLUMN_VALUE},${entries[entry].count}),LEAST(${MAX_STAT_COLUMN_VALUE},${entries[entry].count}),${now},${now})`);

    return `
        INSERT INTO ${type} (guildId,userId,alltime,year,month,week,day,changeDate,addDate)
        VALUES ${sqls.join(',')}
        ON DUPLICATE KEY UPDATE
        guildId = VALUES(guildId),
        userId = VALUES(userId),
        alltime = LEAST(${MAX_STAT_COLUMN_VALUE},alltime + VALUES(alltime)),
        year = LEAST(${MAX_STAT_COLUMN_VALUE},year + VALUES(year)),
        month = LEAST(${MAX_STAT_COLUMN_VALUE},month + VALUES(month)),
        week = LEAST(${MAX_STAT_COLUMN_VALUE},week + VALUES(week)),
        day = LEAST(${MAX_STAT_COLUMN_VALUE},day + VALUES(day)),
        changeDate = VALUES(changeDate);
    `;
  }
  throw new Error(`Invalid xp type "${type}" provided`);
};

const getXpSql = (entries: XpFlushCache) => {
  const sqls = [];
  const now = Math.floor(new Date().getTime() / 1000);

  const least = (s: string | number) => `LEAST(${MAX_STAT_COLUMN_VALUE},${s})`;

  for (const entry in entries) {
    const fields = [
      entries[entry].guildId,
      entries[entry].userId,
      least(entries[entry].count),
      least(entries[entry].count),
      least(entries[entry].count),
      least(entries[entry].count),
      least(entries[entry].count),
    ]
      .map(String)
      .join(',');

    sqls.push(`(${fields})`);
  }

  return `
    INSERT INTO guildMember (guildId,userId,alltime,year,month,week,day)
    VALUES ${sqls.join(',')}
    ON DUPLICATE KEY UPDATE
    guildId = VALUES(guildId),
    userId = VALUES(userId),
    alltime = alltime + VALUES(alltime),
    year = year + VALUES(year),
    month = month + VALUES(month),
    week = week + VALUES(week),
    day = day + VALUES(day);
    `;
};
