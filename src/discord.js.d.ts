import 'discord.js';
import type { pino } from 'pino';
import type { StatFlushCache } from 'bot/statFlushCache.ts';

declare module 'discord.js' {
  export interface Client {
    logger: pino.Logger;
    statFlushCache: Map<string, StatFlushCache>;
  }
}
