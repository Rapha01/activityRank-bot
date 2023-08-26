import masterLogger from '../../util/logger';

let logger = null;

export const init = (shards) => {
  logger = masterLogger.child({ shards });
  return logger;
};

export const logger = logger ?? masterLogger.child({ shards: ['?'] });
