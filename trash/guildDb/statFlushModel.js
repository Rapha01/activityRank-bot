const dbUtil = require('./dbUtil.js');

exports.flush = (manager) => {
  return new Promise(async function (resolve, reject) {
    try {
      console.log('Stat flush start.');
      const shardCaches = await manager.fetchClientValues('appData.statFlushCache');
      const res = manager.broadcastEval('this.appData.statFlushCache = {}');

      let statFlushCache = combineShardCaches(shardCaches);
      console.log(statFlushCache);

      let promises = [];
      for (let dbHost in statFlushCache) {
        for (let type in statFlushCache[dbHost])
          promises.push(guildDb.query(dbHost,getSql(type,statFlushCache[dbHost][type])));
      }

      await Promise.all(promises);

      console.log('Stat flush end.');

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

const getSql = (type,entries) => {
  let sqls = [],now = Math.floor(new Date().getTime() / 1000);
  if (type == 'textMessage' || type == 'voiceMinute') {
    for (let entry in entries)
      sqls.push(`(${entries[entry].guildId},${entries[entry].userId},${entries[entry].channelId},${entries[entry].count},${entries[entry].count},${entries[entry].count},${entries[entry].count},${entries[entry].count},${now})`);

    return `
        INSERT INTO textMessage (guildId,userId,channelId,alltime,year,month,week,day,changedDate)
        VALUES ${sqls.join(',')}
        ON DUPLICATE KEY UPDATE
        guildId = VALUES(guildId),
        userId = VALUES(userId),
        channelId = VALUES(channelId),
        alltime = alltime + VALUES(alltime),
        year = year + VALUES(year),
        month = month + VALUES(month),
        week = week + VALUES(week),
        day = day + VALUES(day),
        changedDate = VALUES(changedDate);
    `;
  }

  if (type == 'vote' || type == 'bonus') {
    for (let entry in entries)
      sqls.push(`(${entries[entry].guildId},${entries[entry].userId},${entries[entry].count},${entries[entry].count},${entries[entry].count},${entries[entry].count},${entries[entry].count},${now})`);

    return `
        INSERT INTO textMessage (guildId,userId,alltime,year,month,week,day,changedDate)
        VALUES ${sqls.join(',')}
        ON DUPLICATE KEY UPDATE
        guildId = VALUES(guildId),
        userId = VALUES(userId),
        alltime = alltime + VALUES(alltime),
        year = year + VALUES(year),
        month = month + VALUES(month),
        week = week + VALUES(week),
        day = day + VALUES(day),
        changedDate = VALUES(changedDate);
    `;
  }

  return '';
};

/*
shard0 -> dbHosts -> type -> entries
shard1 -> type -> entries[dbHost,guildId,..]

await guildDb.query(member.guild.appData.host,`UPDATE textmessage SET
    alltime = alltime + ${count},
    year = year + ${count},
    month = month + ${count},
    week = week + ${count},
    day = day + ${count},
    changedDate = now()
    WHERE guildid = '${member.guild.id}' AND userid = '${member.id}' AND channelid = '${channel.id}'`);

await guildDb.query(member.guild.appData.host,`UPDATE voiceminute SET
    alltime = alltime + ${count},
    year = year + ${count},
    month = month + ${count},
    week = week + ${count},
    day = day + ${count},
    changedDate = now()
    WHERE guildid = '${member.guild.id}' AND userid = '${member.id}' AND channelid = '${channel.id}'`);

await guildDb.query(member.guild.appData.host,`UPDATE vote SET
    alltime = alltime + ${count},
    year = year + ${count},
    month = month + ${count},
    week = week + ${count},
    day = day + ${count},
    changedDate = now()
    WHERE guildid = '${member.guild.id}' AND userid = '${member.id}'`);

await guildDb.query(member.guild.appData.host,`UPDATE bonus SET
    alltime = alltime + ${count},
    year = year + ${count},
    month = month + ${count},
    week = week + ${count},
    day = day + ${count},
    changedDate = now()
    WHERE guildid = '${member.guild.id}' AND userid = '${member.id}'`);*/
