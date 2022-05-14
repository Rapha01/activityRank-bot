const info = require('./server/info.js');

module.exports = (msg,args) => {
  return new Promise(async function (resolve, reject) {
    try {

      // Alias for ar!server info
      await info(msg,args);

    } catch (e) { reject(e); }
    resolve();
  });
}
