import masterLogger from '../../util/logger.ts';

let shardLogger = null;

export const init = (shards: number[]) => {
  shardLogger = masterLogger.child({ shards });
  return shardLogger;
};

export const logger = shardLogger ?? masterLogger.child({ shards: ['?'] });

export default { init, logger };
