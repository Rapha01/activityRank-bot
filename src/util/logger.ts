import pino from 'pino';

const globalConfig = {
  base: { pid: process.pid },
  level: process.env.SUPPRESS_LOGGING !== 'true' ? 'debug' : 'silent',
};

const localConfig = {};
// ! FIXME
/* 
const localConfig =
  //process.env.NODE_ENV === 'development'
  //?
  {
    transport: {
      target: './dev-transport',
    },
  };
//: {} */
const logger = pino.default({ ...globalConfig, ...localConfig });

export default logger;

logger.trace('Logger initialized.');
logger.trace({ env: process.env }, 'Environment');
