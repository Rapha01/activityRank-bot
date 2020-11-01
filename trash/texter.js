const requireFromString = require('require-from-string');
const managerDb = require('../../models/managerDb/managerDb.js');
const guildDb = require('../../models/guildDb/guildDb.js');

exports.commands;
exports.features;
exports.faq;
exports.patchnotes;
exports.feedbacks;
exports.footer;

exports.initTexts = () => {
  return new Promise(async function (resolve, reject) {
    try {
      const textsJs = await backupApi.call(null,'/api/textsJs','get');
      for (key in textsJs)
        exports[key] = requireFromString(textsJs[key]);

      const gl_admin = await localApi.getSingle('gl_admin',{id:0});

      exports.footer = {};
      exports.footer.get = () => {
        return gl_admin.footer;
      }
      resolve();
    } catch (e) { return reject(e); }
  });
}

exports.updateTexts = () => {
  return new Promise(async function (resolve, reject) {
    try {
      const gl_admin = await localApi.getSingle('gl_admin',{id:0});
      exports.footer.get = () => {
        return gl_admin.footer;
      }
      resolve();
    } catch (e) { return reject(e); }
  });
}
