const localApi = require('../../local/api.js');

exports.getNewest = (userId) => {
  return new Promise(async function (resolve, reject) {
    try {
      const conditions = {userid: userId};
      let externUpvote = await localApi.getSingle('gl_externupvote',conditions);

      resolve(externUpvote);
    } catch (e) { reject(e); }
  });
}

exports.get = (userId,source,dateadded) => {
  return new Promise(async function (resolve, reject) {
    try {
      const conditions = {userid: userId,source: source,dateadded: dateadded};
      let externUpvote = await localApi.getSingle('gl_externupvote',conditions);

      resolve(externUpvote);
    } catch (e) { reject(e); }
  });
}
