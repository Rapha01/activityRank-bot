// GENERATED: this file has been altered by `relative-named-imports`.
// [GENERATED: relative-named-imports:v0]

// GENERATED: added extension to relative import
// import masterLogger from '../../util/logger';
import masterLogger from '../../util/logger.js';

let logger = null;

export const init = (shards) => {
  logger = masterLogger.child({ shards });
  return logger;
};

export const logger = logger ?? masterLogger.child({ shards: ['?'] });
