const masterLogger = require('../../util/logger');

let logger = null;
module.exports.init = (shards) => {
  logger = masterLogger.child({ shards });
  return logger;
};
module.exports.logger = logger ?? masterLogger.child({ shards: ['?'] });
