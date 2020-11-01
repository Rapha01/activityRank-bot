const managerDb = require('./managerDb.js');

const hostField = process.env.NODE_ENV == 'production' ? 'hostIntern' : 'hostExtern';

exports.get = (userId) => {
  return new Promise(async function (resolve, reject) {
    try {
      let res = await managerDb.query(`SELECT ${hostField} AS host FROM userRoute LEFT JOIN dbShard ON userRoute.dbShardId = dbShard.id WHERE userId = ${userId}`);

      if (res.length < 1) {
         await managerDb.query(`INSERT INTO userRoute (userId) VALUES (${userId})`);
         res = await managerDb.query(`SELECT ${hostField} AS host FROM userRoute LEFT JOIN dbShard ON userRoute.dbShardId = dbShard.id WHERE userId = ${userId}`);
      }

      resolve(res[0].host);
    } catch (e) { reject(e); }
  });
}
