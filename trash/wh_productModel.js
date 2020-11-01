const mysql = require('mysql');
const managerDb = require('./managerDb.js');

exports.insert = (txnplatform,txnid,until) => {
  return new Promise(async function (resolve, reject) {
    try {
      const res = await managerDb.query(`INSERT INTO wh_product (txnplatform,txnid,until) VALUES (${mysql.escape(txnplatform)},${mysql.escape(txnid)},${mysql.escape()})`);
      resolve(res);
    } catch (e) { reject(e); }
  });
}

/*
exports.get = (txnplatform,txnid) => {
  return new Promise(async function (resolve, reject) {
    try {
      let res = await managerDb.query(`SELECT * FROM product WHERE txnplatform = ${txnplatform} AND txnid = ${txnid}`);

      if (!res)
        resolve(null);
      else
        resolve(res[0]);

    } catch (e) { reject(e); }
  });
}

exports.get = (txnplatform,txnid) => {
  return new Promise(async function (resolve, reject) {
    try {
      let res = await managerDb.query(`SELECT * FROM product WHERE txnplatform = ${txnplatform} AND txnid = ${txnid}`);

      if (!res) {
        await managerDb.query(`INSERT INTO product (txnplatform,txnid) VALUES (${txnplatform},${txnid})`);
        res = await managerDb.query(`SELECT * FROM product WHERE txnplatform = ${txnplatform} AND txnid = ${txnid}`);
      }

      resolve(res[0]);
    } catch (e) { reject(e); }
  });
}
*/
