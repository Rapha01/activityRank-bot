const top = require('./server/top.js');

// Alias for ar!member stats

module.exports = (msg,args) => {
  return new Promise(async function (resolve, reject) {
    try {

      args.unshift('members');
      await top(msg,args);

    } catch (e) { reject(e); }
    resolve();
  });
}
