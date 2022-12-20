const managerDb = require('./managerDb.js');

exports.storage = {};
exports.cache = {};

exports.storage.get = () => {
  return new Promise(async function (resolve, reject) {
    try {
      const texts = await managerDb.fetch(null, '/api/texts/', 'get');

      resolve(texts);
    } catch (e) {
      reject(e);
    }
  });
};

exports.cache.load = (client) => {
  return new Promise(async function (resolve, reject) {
    try {
      client.appData.texts = await exports.storage.get();

      resolve();
    } catch (e) {
      reject(e);
    }
  });
};
