import pretty from 'pino-pretty';
export default (opts: pretty.PrettyOptions) =>
  pretty.default({
    ...opts,
    colorize: true,
    translateTime: 'SYS:mm/dd HH:MM:ss',
    singleLine: true,
    ignore: 'pid,hostname,shards,i,interaction',
    messageFormat: format,
  });

const format: pretty.PinoPretty.MessageFormatFunc = (log, messageKey) =>
  ('shards' in log && Array.isArray(log.shards) ? `[${log.shards.join(', ')}] ` : '') +
  log[messageKey];
