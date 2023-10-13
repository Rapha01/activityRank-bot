import type { StatFlushCache } from 'bot/statFlushCache.ts';
import type { pino } from 'pino';
import 'discord.js';
import type { guildChannel, user } from 'models/types/shard.js';
import type { CachedGuild } from 'bot/models/guild/guildModel.ts';
import type { CachedGuildMember } from 'bot/models/guild/guildMemberModel.ts';
import type { CachedRole } from 'bot/models/guild/guildRoleModel.ts';
import type { TextsData } from 'models/types/external.js';

interface ClientAppData {
  settings: Record<string, string>;
  texts: TextsData;
  statFlushCache: Record<string, StatFlushCache>;
  botShardStat: {
    commandsTotal: number;
    textMessagesTotal: number;
  };
}

declare module 'discord.js' {
  export interface Role {
    appData: CachedRole;
  }
  export interface User {
    appData: user;
  }
  export interface Client {
    appData: ClientAppData;
    logger: pino.Logger;
  }
  export interface Guild {
    appData: CachedGuild;
  }
  export interface GuildChannel {
    appData: guildChannel;
  }
  export interface GuildMember {
    appData: CachedGuildMember;
  }
}
