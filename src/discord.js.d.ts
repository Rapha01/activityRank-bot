import 'discord.js';
import type { pino } from 'pino';
import type { StatFlushCache } from 'bot/statFlushCache.ts';
import type { XpFlushCache } from 'bot/xpFlushCache.ts';

declare module 'discord.js' {
  export interface Client {
    logger: pino.Logger;
    statFlushCache: Record<string, StatFlushCache>;
    xpFlushCache: Record<string, XpFlushCache>;
    botShardStat: { commandsTotal: number; textMessagesTotal: number };
  }
}
