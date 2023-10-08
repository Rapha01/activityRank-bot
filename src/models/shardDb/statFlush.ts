import shardDb from './shardDb.js';
import logger from '../../util/logger.js';
import type { ShardingManager } from 'discord.js';
import type {
  StatFlushCache,
  StatFlushCacheChannelEntry,
  StatFlushCacheGuildEntry,
} from 'bot/statFlushCache.js';
import type { StatType } from 'models/types/enums.js';

export default async function (manager: ShardingManager) {
  const hrstart = process.hrtime();
  const shardCaches = (await manager.fetchClientValues('appData.statFlushCache')) as Record<
    string,
    StatFlushCache
  >[];

  let statFlushCache = combineShardCaches(shardCaches);

  let promises = [],
    counts = {},
    count = 0;
  for (let dbHost in statFlushCache)
    for (let type in statFlushCache[dbHost]) {
      promises.push(
        shardDb.query(dbHost, getSql(type as StatType, statFlushCache[dbHost][type as StatType])!),
      );
      count = Object.keys(statFlushCache[dbHost][type]).length;
      counts[type] ? (counts[type] += count) : (counts[type] = count);
    }

  await Promise.all(promises);

  const hrend = process.hrtime(hrstart);
  logger.info(
    'Stat flush finished after ' + hrend + 's. Saved rows: ' + JSON.stringify(counts) + '',
  );
}

const combineShardCaches = (shardCaches: Record<string, StatFlushCache>[]) => {
  let statFlushCache: Record<string, StatFlushCache> = {};

  for (const shard of shardCaches) {
    for (const dbHost in shard) {
      if (!statFlushCache[dbHost]) statFlushCache[dbHost] = {};

      for (const type in shard[dbHost]) {
        if (!statFlushCache[dbHost][type as StatType])
          statFlushCache[dbHost][type as StatType] = {};

        statFlushCache[dbHost][type as StatType] = {
          ...statFlushCache[dbHost][type as StatType],
          ...shard[dbHost][type as StatType],
        };
      }
    }
  }

  return statFlushCache;
};

const maxValue = 100000000;
const getSql = (
  type: StatType,
  entries: (StatFlushCacheChannelEntry | StatFlushCacheGuildEntry)[],
) => {
  let sqls = [],
    now = Math.floor(new Date().getTime() / 1000);

  if (type == 'textMessage' || type == 'voiceMinute') {
    for (let entry in entries)
      sqls.push(`(${entries[entry].guildId},${entries[entry].userId},${entries[entry].channelId},
          LEAST(${maxValue},${entries[entry].count}),LEAST(${maxValue},${entries[entry].count}),
          LEAST(${maxValue},${entries[entry].count}),LEAST(${maxValue},${entries[entry].count}),LEAST(${maxValue},${entries[entry].count}),${now},${now})`);

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
  }

  if (type == 'invite' || type == 'vote' || type == 'bonus') {
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
  }
};

/*
shard0 -> dbHosts -> type -> entries
shard1 -> type -> entries[dbHost,guildId,..]
*/
