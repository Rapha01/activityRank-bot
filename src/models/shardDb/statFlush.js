const shardDb = require('./shardDb.js');

module.exports = (manager) => {
  return new Promise(async function (resolve, reject) {
    try {
      const hrstart = process.hrtime();
      const shardCaches = await manager.fetchClientValues('appData.statFlushCache');
      const res = manager.broadcastEval('this.appData.statFlushCache = {}');

      let statFlushCache = combineShardCaches(shardCaches);

      let promises = [],counts = {},count = 0;
      for (let dbHost in statFlushCache)
        for (let type in statFlushCache[dbHost]) {
          promises.push(shardDb.query(dbHost,getSql(type,statFlushCache[dbHost][type])));
          count = Object.keys(statFlushCache[dbHost][type]).length;
          counts[type] ? counts[type] +=  count : counts[type] = count;
        }

      await Promise.all(promises);

      const hrend = process.hrtime(hrstart);
      console.log('Stat flush finished after ' + hrend + 's. Saved rows: ' +  JSON.stringify(counts) + '');

      return resolve();
    } catch (e) { reject(e); }
  });
};

const combineShardCaches = (shardCaches) => {
  let statFlushCache = {};

  for (let shard of shardCaches) {
    for (let dbHost in shard) {
      if (!statFlushCache[dbHost]) statFlushCache[dbHost] = {};

      for (let type in shard[dbHost]) {
        if (!statFlushCache[dbHost][type]) statFlushCache[dbHost][type] = {};

        statFlushCache[dbHost][type] = {...statFlushCache[dbHost][type], ...shard[dbHost][type]};
      }
    }
  }

  return statFlushCache;
};

const maxValue = 100000000;
const getSql = (type,entries) => {
  let sqls = [],now = Math.floor(new Date().getTime() / 1000);

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

  if (type == 'vote' || type == 'bonus') {
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
