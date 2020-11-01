const guildModel = require('../models/guild/guildModel.js');
const fct = require('../../util/fct.js');

module.exports = (guild) => {
  return new Promise(async function (resolve, reject) {
    try {
      await guildModel.cache.load(guild);
      //await guildModel.storage.set(guild,'createDate',new Date() / 1000);

      resolve();
    } catch (e) { reject(e); }
  });
}
