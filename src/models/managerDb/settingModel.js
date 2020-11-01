const managerDb = require('./managerDb.js');

exports.storage = {};
exports.cache = {};

exports.storage.get = () => {
  return new Promise(async function (resolve, reject) {
    try {
      const res = await managerDb.query('SELECT * from setting');

      let settings = {};

      for (setting of res)
        settings[setting.id] = setting.value;

      resolve(settings);
    } catch (e) { reject(e); }
  });
}

exports.cache.load = (client) => {
  return new Promise(async function (resolve, reject) {
    try {
      client.appData.settings = await exports.storage.get();

      resolve();
    } catch (e) { reject(e); }
  });
}
