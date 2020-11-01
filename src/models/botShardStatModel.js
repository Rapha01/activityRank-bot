const managerDb = require('./managerDb.js');

exports.getShardServerCounts = () => {
  return new Promise(async function (resolve, reject) {
    try {
      const results = await managerDb.query(`SELECT serverCount FROM botShardStat WHERE shardid < 1000000`);

      let counts = [];
      for (let res of results)
        counts.push(res.serverCount);

      return resolve(counts);
    } catch (e) { reject(e); }
  });
}
