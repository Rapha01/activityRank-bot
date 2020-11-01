const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

let dbUser,dbPassword,dbName,dbHost;
if (process.env.NODE_ENV == 'production') {
  dbHost = '';
  dbUser = ''
  dbPassword = '';
  dbName = '';
} else {
  dbHost = '';
  dbUser = '';
  dbPassword = '';
  dbName = '';
}

const url = `mongodb://${encodeURIComponent(dbUser)}:${encodeURIComponent(dbPassword)}@${dbHost}:27017/?authMechanism=DEFAULT`;

const client = new MongoClient(url,{useUnifiedTopology: true});

let conn,db;

module.exports.get = () => {
  return new Promise(async function (resolve, reject) {
    try {
      if (!conn || !db) {
        conn = await client.connect();
        db = conn.db(dbName);
        console.log("Connected successfully to server");
      }

      resolve(db);
    } catch (e) { reject(e); }
  });
};

//conn.close();
