const fct = require('../fct.js');
const db = require('./local/db.js');

exports.getDueRows = (tablename,minDateChangedDiffMinutes,maxDateBackedupDiffMinutes) => {
  return new Promise(async function (resolve, reject) {
    try {
      db.query(`SELECT * FROM ${tablename} WHERE haschanged=1 AND (datechanged < (NOW() - INTERVAL ${minDateChangedDiffMinutes} MINUTE) OR datebackedup < (NOW() - INTERVAL ${maxDateBackedupDiffMinutes} MINUTE))`, function (err, results, fields) { //
        if (err) return reject(err);

        resolve(results);
      });
    } catch (e) { reject(e); }
  });
}

exports.unmarkRows = (tablename,rows) => {
  return new Promise(async function (resolve, reject) {
    try {
      if (rows.length == 0)
        return resolve();

      const keys = fct.extractRowKeys(rows[0]);
      if (keys.length == 0)
        return resolve();

      let conditionsSQLs = [],rowConditionsSQL;
      for (row of rows) {
        rowConditionsSQL = [];
        for (key of keys)
          rowConditionsSQL.push(key + '=' + row[key]);

        conditionsSQLs.push(rowConditionsSQL.join('AND'));
      }

      console.log(conditionsSQLs.join(' OR '));
      db.query(`UPDATE ${tablename} SET haschanged=0,datebackedup=now() WHERE ${conditionsSQLs.join(' OR ')}`, function (err, results, fields) { //
        if (err) return reject(err);

        resolve(results);
      });
    } catch (e) { reject(e); }
  });
}
