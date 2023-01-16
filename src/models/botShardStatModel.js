const managerDb = require('./managerDb.js');

exports.getShardServerCounts = () => {
  return new Promise(async function (resolve, reject) {
    try {
      const results = await managerDb.query(`SELECT serverCount FROM botShardStat WHERE shardId < 1000000`);

      let counts = [];
      for (let res of results)
        counts.push(res.serverCount);

      return resolve(counts);
    } catch (e) { reject(e); }
  });
}

exports.getShardStats = async () => {
  return await managerDb.query(
    `SELECT shardId, status, serverCount, uptimeSeconds, readyDate, ip, changedHealthDate
    FROM botShardStat WHERE shardId < 1000000`
  );
}
