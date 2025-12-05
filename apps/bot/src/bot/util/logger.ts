import masterLogger from '../../util/logger.ts';

let shardLogger = null;

export const init = (shardId: number) => {
  shardLogger = masterLogger.child({ shardId });
  return shardLogger;
};

export const logger = shardLogger ?? masterLogger.child({ shardId: '?' });

export default { init, logger };
