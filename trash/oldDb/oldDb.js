const mysql = require('promise-mysql');

let dbuser,dbpassword,dbname,dbhost,conn;

if (process.env.NODE_ENV == 'production') {
  dbhost = '';
  dbuser = ''
  dbpassword = '';
  dbname = '';
} else {
  dbhost = '';
  dbuser = '';
  dbpassword = '';
  dbname = '';
}

module.exports.getConnection = () => {
  return new Promise(async function (resolve, reject) {
    try {
      if (!conn) {
        conn = await mysql.createConnection({
          host                : dbhost,
          user                : dbuser,
          password            : dbpassword,
          database            : dbname,
          dateStrings         : 'date',
          charset             : 'utf8mb4',
          supportBigNumbers   : true,
          bigNumberStrings    : true
        });

        console.log('Connected to ' + dbhost);
      }

      resolve(conn);
    } catch (e) { reject(e); }
  });
};

module.exports.query = (sql) => {
  return new Promise(async function (resolve, reject) {
    try {
      const res = await conn.query(sql);

      resolve(res);
    } catch (e) { reject(e); }
  });
};
