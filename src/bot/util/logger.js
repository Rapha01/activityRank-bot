// GENERATED: this file has been altered by `relative-named-imports`.
// [GENERATED: relative-named-imports:v0]

// GENERATED: added extension to relative import
// import masterLogger from '../../util/logger';
import masterLogger from '../../util/logger.js';

let shardLogger = null;

export const init = (shards) => {
  shardLogger = masterLogger.child({ shards });
  return shardLogger;
};

export const logger = shardLogger ?? masterLogger.child({ shards: ['?'] });


// GENERATED: start of generated content by `exports-to-default`.
// [GENERATED: exports-to-default:v0]

export default {
    init,
    logger,
}

// GENERATED: end of generated content by `exports-to-default`.

