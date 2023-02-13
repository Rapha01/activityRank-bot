const pino = require('pino');

const globalConfig = { base: { pid: process.pid }, level: 'debug' };

const localConfig =
  //process.env.NODE_ENV === 'development' 
    //? 
    {
      transport: {
        target: './dev-transport',
      },
    }
    //: {}
    ;

const logger = pino({ ...globalConfig, ...localConfig });

module.exports = logger;

logger.trace('Logger initialized.');
logger.trace({ env: process.env }, 'Environment');
