module.exports = (opts) =>
  require('pino-pretty')({
    ...opts,
    colorize: true,
    translateTime: 'SYS:mm/dd HH:MM:ss',
    singleLine: true,
    ignore: 'pid,hostname,shards,i,interaction',
    messageFormat: format,
  });

const format = (log, messageKey) =>
  ('shards' in log ? `[${log.shards.join(', ')}] ` : '') + log[messageKey];
