import managerDb from './managerDb.js';

export const storage = {};
export const cache = {};

storage.get = () => {
  return new Promise(async function (resolve, reject) {
    try {
      const texts = await managerDb.fetch(null, '/api/texts/', 'get');

      resolve(texts);
    } catch (e) {
      reject(e);
    }
  });
};

cache.load = (client) => {
  return new Promise(async function (resolve, reject) {
    try {
      client.appData.texts = await storage.get();

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
