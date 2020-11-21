const top = require('./server/top.js');

module.exports = (msg,args) => {
  return new Promise(async function (resolve, reject) {
    try {

      // Alias for ar!server top members
      args.unshift('members');
      await top(msg,args);

    } catch (e) { reject(e); }
    resolve();
  });
}
