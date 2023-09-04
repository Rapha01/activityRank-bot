import type { CachedGuild } from 'bot/models/guild/guildModel.ts';
import type { StatFlushCache } from 'bot/statFlushCache.ts';
import 'discord.js';

interface RoleAppData {
  noXp: boolean;
}
interface ClientAppData {
  settings: Record<any, any>;
  texts: any;
  statFlushCache: Record<string, StatFlushCache>;
}

declare module 'discord.js' {
  export interface Role {
    appData: RoleAppData;
  }
  export interface Client {
    appData: ClientAppData;
  }
  export interface Guild {
    appData: CachedGuild;
  }
}
