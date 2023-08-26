import managerDb from './managerDb.js';

export const storage = {};
export const cache = {};

storage.get = () => {
  return new Promise(async function (resolve, reject) {
    try {
      const res = await managerDb.query('SELECT * from setting');

      let settings = {};

      for (setting of res) settings[setting.id] = setting.value;

      resolve(settings);
    } catch (e) {
      reject(e);
    }
  });
};

cache.load = (client) => {
  return new Promise(async function (resolve, reject) {
    try {
      client.appData.settings = await storage.get();

      resolve();
    } catch (e) {
      reject(e);
    }
  });
};

// GENERATED: start of generated content by `exports-to-default`.
// [GENERATED: exports-to-default:v0]

export default {
  storage,
  cache,
};

// GENERATED: end of generated content by `exports-to-default`.
