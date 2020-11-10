const fct = require('../../util/fct.js');

module.exports = (member) => {
  return new Promise(async function (resolve, reject) {
    try {
      if (member.user.bot)
        return resolve();


      resolve();
    } catch (e) { reject(e); }
  });
}
