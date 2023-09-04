import type { CachedGuild } from 'bot/models/guild/guildModel.ts';
import type { StatFlushCache } from 'bot/statFlushCache.ts';
import type { pino } from 'pino';
import 'discord.js';

interface UserAppData {
  isBanned?: boolean;
  dbHost: string;
}
interface RoleAppData {
  noXp: boolean;
}
interface ClientAppData {
  settings: Record<any, any>;
  texts: any;
  statFlushCache: Record<string, StatFlushCache>;
  botShardStat: {
    commandsTotal: number;
    textMessagesTotal: number;
  };
}

declare module 'discord.js' {
  export interface Role {
    appData: RoleAppData;
  }
  export interface User {
    appData: UserAppData;
  }
  export interface Client {
    appData: ClientAppData;
    logger: pino.Logger;
  }
  export interface Guild {
    appData: CachedGuild;
  }
}
