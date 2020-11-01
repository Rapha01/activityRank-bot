const fetch = require('node-fetch');
const config = require('../../config.js');
const mysql = require('mysql');
const db = require('./db.js');
const fct = require('../../fct.js');

exports.getSingle = (tablename,conditions) => {
  return new Promise(async function (resolve, reject) {
    const conditionsSQL = fct.conditionsToSQL(conditions);

    db.query(`SELECT * FROM ${tablename} WHERE ${conditionsSQL} ORDER BY dateadded DESC`, function (err, results, fields) {
      if (err) return reject(err);
      if (results.length == 0)
        return resolve(null);
      else
        return resolve(results[0]);
    });
  });
}

exports.getMulti = (tablename,conditions) => {
  return new Promise(async function (resolve, reject) {
    const conditionsSQL = fct.conditionsToSQL(conditions);

    db.query(`SELECT * FROM ${tablename} WHERE ${conditionsSQL}`, function (err, results, fields) {
      if (err) return reject(err);
      return resolve(results);
    });
  });
}

exports.setSingle = (tablename,conditions,field,value) => {
  return new Promise(async function (resolve, reject) {
    const conditionsSQL = fct.conditionsToSQL(conditions);

    db.query(`UPDATE ${tablename} SET ${field} = ${mysql.escape(value)},datechanged = now(),datebackedup = IF(haschanged=0,now(),datebackedup),haschanged=1 WHERE ${conditionsSQL}`, function (err, results, fields) {
      if (err) return reject(err);
      return resolve(results);
    });
  });
}

exports.deleteSingle = (tablename,conditions) => {
  return new Promise(async function (resolve, reject) {
    const conditionsSQL = fct.conditionsToSQL(conditions);

    db.query(`DELETE FROM ${tablename} WHERE ${conditionsSQL}`, function (err, results, fields) {
      if (err) return reject(err);
      return resolve(results);
    });
  });
}

exports.loadSingle = (tablename,obj) => {
  return new Promise(async function (resolve, reject) {
    try {
      //console.log('Singleload to ' + tablename + '.');

      const properties = Object.keys(obj);
      properties.unset('haschanged');
      let values = [];

      for (property of properties)
        values.push(mysql.escape(obj[property]));

      db.query(`INSERT IGNORE INTO ${tablename} (${properties.join(',')}) VALUES (${values.join(',')})`,
        function (err, results, fields) {
          if (err) return reject(err);
          resolve();
      });
    } catch (e) { reject(e); }
  });
}

exports.loadMulti = (tablename,arr) => {
  return new Promise(async function (resolve, reject) {
    try {
      if (arr.length < 1)
        return resolve();

      const properties = Object.keys(arr[0]);
      properties.unset('haschanged');
      let rowStrings = [],rowString,rowValues,batch;

      for (obj of arr) {
        rowValues = [];

        for (property of properties)
          rowValues.push(mysql.escape(obj[property]));

        rowStrings.push('(' + rowValues.join(',') + ')');
      }

      while (rowStrings.length > 0) {
        batch = rowStrings.splice(0,10);

        await batchInsert(tablename,properties.join(','),batch.join(','));
      }

      resolve();
    } catch (e) { reject(e); }
  });
}

exports.getUpdatedRows = (tablename) => {
  return new Promise(function (resolve, reject) {
    db.query(`SELECT * FROM ${tablename} WHERE haschanged = 1`, async function (err, results, fields) {
      if (err) return reject(err);
      return resolve(results);
    });
  });
}

exports.resetUpdatedRows = (tablename) => {
  return new Promise(function (resolve, reject) {
    db.query(`UPDATE ${tablename} SET haschanged = 0 WHERE haschanged = 1`, async function (err, results, fields) {
      if (err) return reject(err);
      return resolve();
    });
  });
}

function batchInsert(tablename,propertiesString,insertString) {
  return new Promise(async function (resolve, reject) {
    db.query(`INSERT IGNORE INTO ${tablename} (${propertiesString}) VALUES ${insertString}`,
      function (err, results, fields) {
        if (err) return reject(err);
        resolve();
    });
  });
}
