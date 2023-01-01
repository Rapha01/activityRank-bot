const managerDb = require('./managerDb.js');

const hostField = process.env.NODE_ENV == 'production' ? 'hostIntern' : 'hostExtern';

exports.get = (guildId) => {
  return new Promise(async function (resolve, reject) {
    try {
      let res = await managerDb.query(`SELECT ${hostField} AS host FROM guildRoute LEFT JOIN dbShard ON guildRoute.dbShardId = dbShard.id WHERE guildId = ${guildId}`);

      if (res.length < 1) {
         await managerDb.query(`INSERT INTO guildRoute (guildId) VALUES (${guildId})`);
         res = await managerDb.query(`SELECT ${hostField} AS host FROM guildRoute LEFT JOIN dbShard ON guildRoute.dbShardId = dbShard.id WHERE guildId = ${guildId}`);
      }

      resolve(res[0].host);
    } catch (e) { reject(e); }
  });
}

