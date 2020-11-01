const mysql = require('mysql');
const fct = require('../../fct.js');
const backupapi = require('../backup/api.js');

let dbuser,dbpassword,dbname,host;
if (process.env.NODE_ENV == 'production') {
  host = 'mysql';
  dbuser = 'root';
  dbpassword = '';
  dbname = 'activityrank';
  console.log('production');
} else {
  host = 'mysqldev';
  dbuser = 'root';
  dbpassword = '';
  dbname = 'activityrank';
  console.log('development');
}

const db = mysql.createConnection({
  host        : host,
  user        : dbuser,
  password    : dbpassword,
  dateStrings : 'date',
  charset     : 'utf8mb4',
  multipleStatements: true
});

db.myConnect = () => {
  return new Promise(async function (resolve, reject) {
    await myConnect();
    await set_env();

    // Problem is most likely not using ALTER TABLE ADD INDEX statements in the requested schema, like in the manual export.
    /* if (!await existsDb(dbname)) {
      await initSchema();
      console.log('First startup. Database initialization successful.');
    } */

    await useDb();
    resolve();
  });
}

function initSchema() {
  return new Promise(async function (resolve, reject) {
    try {
      let schema = await backupapi.getDbSchema();
      schema = `CREATE DATABASE IF NOT EXISTS ${dbname} DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci; USE ${dbname}; ` + schema;
      schema = schema.replace(/ENGINE=InnoDB/g,'ENGINE=MEMORY');
      await set_env();
      await loadSchema(schema);

      resolve();
    } catch (e) { return reject(e); }
  });
}

function myConnect() {
  return new Promise(async function (resolve, reject) {
    db.connect(async (err) => {
      if (err) return reject(err);
      return resolve();
    });
  });
}

function loadSchema(schema) {
  return new Promise(async function (resolve, reject) {
    db.query(schema, function (err, results, fields) {
      if (err) return reject(err);
      resolve();
    });
  });
}

function useDb() {
  return new Promise(async function (resolve, reject) {
    db.changeUser({ database : dbname }, function(err) {
      if (err) return reject(err);
      resolve();
    });
  });
}

function set_env() {
  return new Promise(async function (resolve, reject) {
    db.query(`
        SET TIME_ZONE = '-00:00';
        SET GLOBAL max_heap_table_size = 1024 * 1024 * 1024 * 8;
        SET GLOBAL tmp_table_size = 1024 * 1024 * 1024 * 8;`, function (err, results, fields) {
      if (err) return reject(err);
      resolve();
    });
  });
}

function existsDb(dbname) {
  return new Promise(async function (resolve, reject) {
    db.query(`SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '${dbname}'`, function (err, results, fields) {
      if (err) return reject(err);

      if (results.length == 0)
        resolve(false);
      else
        resolve(true);
    });
  });
}

Array.prototype.unset = function(value) {
    while (this.indexOf(value) != -1)
      this.splice(this.indexOf(value), 1);
}

module.exports = db;
