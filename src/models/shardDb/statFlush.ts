import shardDb from './shardDb.js';
import logger from '../../util/logger.js';
import type { ShardingManager } from 'discord.js';
import type {
  StatFlushCache,
  StatFlushCacheChannelEntry,
  StatFlushCacheGuildEntry,
} from 'bot/statFlushCache.js';
import type { StatType } from 'models/types/enums.js';
import { inspect } from 'node:util';
import type { XpFlushCache } from 'bot/xpFlushCache.js';

export default async function (manager: ShardingManager) {
  const shardCaches = (await manager.fetchClientValues('statFlushCache')) as Record<
    string,
    StatFlushCache
  >[];
  manager.broadcastEval((client) => (client.statFlushCache = {}));

  const xpCaches = (await manager.fetchClientValues('xpFlushCache')) as Record<
    string,
    XpFlushCache
  >[];
  manager.broadcastEval((client) => (client.xpFlushCache = {}));

  await runStatFlush(shardCaches);
  await runXpFlush(xpCaches);
}

async function runStatFlush(caches: Record<string, StatFlushCache>[]) {
  const hrstart = process.hrtime();

  let statFlushCache = combineShardCaches(caches);

  let promises = [];
  const counts: { [k in keyof StatFlushCache]?: number } = {};

  for (let dbHost in statFlushCache) {
    for (let _type in statFlushCache[dbHost]) {
      const type = _type as StatType;
      const count = Object.keys(statFlushCache[dbHost][type]).length;
      if (count < 1) continue;

      promises.push(shardDb.query(dbHost, getSql(type, statFlushCache[dbHost][type])!));
      counts[type] ? (counts[type]! += count) : (counts[type] = count);
    }
  }

  await Promise.all(promises);

  const hrend = process.hrtime(hrstart);
  logger.info(`Stat flush finished after ${hrend}s. Saved rows: ${inspect(counts)}`);
}

async function runXpFlush(caches: Record<string, XpFlushCache>[]) {
  const hrstart = process.hrtime();

  let flushCache = combineXpCaches(caches);

  let promises = [];
  let count = 0;

  for (let dbHost in flushCache) {
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
  let statFlushCache: Record<string, StatFlushCache> = {};

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
  let flushCache: Record<string, XpFlushCache> = {};

  for (const shard of shardCaches) {
    for (const dbHost in shard) {
      flushCache[dbHost] = { ...flushCache[dbHost], ...shard[dbHost] };
    }
  }

  return flushCache;
};

const maxValue = 100000000;

const getSql = <T extends StatType>(
  type: T,
  entries: T extends 'textMessage' | 'voiceMinute'
    ? Record<string, StatFlushCacheChannelEntry>
    : Record<string, StatFlushCacheGuildEntry>,
) => {
  let sqls = [],
    now = Math.floor(new Date().getTime() / 1000);

  if (type == 'textMessage' || type == 'voiceMinute') {
    for (let entry in entries)
      sqls.push(`(${entries[entry].guildId},${entries[entry].userId},${
        (entries[entry] as StatFlushCacheChannelEntry).channelId
      },
          LEAST(${maxValue},${entries[entry].count}),LEAST(${maxValue},${entries[entry].count}),
          LEAST(${maxValue},${entries[entry].count}),LEAST(${maxValue},${
            entries[entry].count
          }),LEAST(${maxValue},${entries[entry].count}),${now},${now})`);

    return `
        INSERT INTO ${type} (guildId,userId,channelId,alltime,year,month,week,day,changeDate,addDate)
        VALUES ${sqls.join(',')}
        ON DUPLICATE KEY UPDATE
        guildId = VALUES(guildId),
        userId = VALUES(userId),
        channelId = VALUES(channelId),
        alltime = LEAST(${maxValue},alltime + VALUES(alltime)),
        year = LEAST(${maxValue},year + VALUES(year)),
        month = LEAST(${maxValue},month + VALUES(month)),
        week = LEAST(${maxValue},week + VALUES(week)),
        day = LEAST(${maxValue},day + VALUES(day)),
        changeDate = VALUES(changeDate);
    `;
  } else if (type == 'invite' || type == 'vote' || type == 'bonus') {
    for (let entry in entries)
      sqls.push(`(${entries[entry].guildId},${entries[entry].userId},
          LEAST(${maxValue},${entries[entry].count}),LEAST(${maxValue},${entries[entry].count}),LEAST(${maxValue},${entries[entry].count}),
          LEAST(${maxValue},${entries[entry].count}),LEAST(${maxValue},${entries[entry].count}),${now},${now})`);

    return `
        INSERT INTO ${type} (guildId,userId,alltime,year,month,week,day,changeDate,addDate)
        VALUES ${sqls.join(',')}
        ON DUPLICATE KEY UPDATE
        guildId = VALUES(guildId),
        userId = VALUES(userId),
        alltime = LEAST(${maxValue},alltime + VALUES(alltime)),
        year = LEAST(${maxValue},year + VALUES(year)),
        month = LEAST(${maxValue},month + VALUES(month)),
        week = LEAST(${maxValue},week + VALUES(week)),
        day = LEAST(${maxValue},day + VALUES(day)),
        changeDate = VALUES(changeDate);
    `;
  } else {
    throw new Error(`Invalid xp type "${type}" provided`);
  }
};

const getXpSql = (entries: XpFlushCache) => {
  let sqls = [],
    now = Math.floor(new Date().getTime() / 1000);

  const least = (s: string | number) => `LEAST(${maxValue},${s})`;

  for (let entry in entries) {
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
    alltime = LEAST(${maxValue},alltime + VALUES(alltime)),
    year = LEAST(${maxValue},year + VALUES(year)),
    month = LEAST(${maxValue},month + VALUES(month)),
    week = LEAST(${maxValue},week + VALUES(week)),
    day = LEAST(${maxValue},day + VALUES(day)),
    `;
};
