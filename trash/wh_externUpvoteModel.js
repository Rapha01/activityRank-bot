const mysql = require('mysql');
const managerDb = require('./managerDb.js');

exports.insert = (userId,source) => {
  return new Promise(async function (resolve, reject) {
    try {
      const res = await managerDb.query(`INSERT INTO wh_externUpvote (userid,source) VALUES (${mysql.escape(userId)},${mysql.escape(source)})`);
      resolve(res);
    } catch (e) { reject(e); }
  });
}
