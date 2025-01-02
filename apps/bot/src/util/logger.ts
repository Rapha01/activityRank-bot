import pino from 'pino';

// @ts-expect-error Pino typings are a bit broken
const logger = pino.default({
  base: { pid: process.pid },
  level: process.env.SUPPRESS_LOGGING !== 'true' ? 'debug' : 'silent',
});

export default logger;

logger.trace('Logger initialized.');
logger.trace({ env: process.env }, 'Environment');
