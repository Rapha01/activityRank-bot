import type { Generated, Insertable, Selectable, Updateable } from 'kysely';

export interface BotShardStatSchema {
  shardId: number;
  status: number;
  serverCount: Generated<number>;
  uptimeSeconds: Generated<number>;
  readyDate: Generated<number>;
  ip: string;
  changedHealthDate: Generated<number>;
  commands1h: Generated<number>;
  botInvites1h: Generated<number>;
  botKicks1h: Generated<number>;
  voiceMinutes1h: Generated<number>;
  textMessages1h: Generated<number>;
  roleAssignments1h: Generated<number>;
  rolesDeassignments1h: Generated<number>;
  changedStatDate: Generated<number>;
  restartQueued: Generated<number>;
  commandsTotal: Generated<number>;
  textMessagesTotal: Generated<number>;
}

export interface DbShardSchema {
  id: Generated<string>;
  host: Generated<string>;
}

export interface GuildRouteSchema {
  guildId: Generated<string>;
  dbShardId: Generated<number>;
}

export interface SessionSchema {
  id: string;
  user_id: string; // bigint
  access_token: string;
  refresh_token: string;
  expires_at: Date;
}

export interface UserRouteSchema {
  userId: Generated<string>;
  dbShardId: Generated<number>;
}

export interface WebUserSchema {
  id: string; // bigint
  username: string;
  avatar_hash: string | null;
}

export interface ManagerDB {
  botShardStat: BotShardStatSchema;
  dbShard: DbShardSchema;
  guildRoute: GuildRouteSchema;
  session: SessionSchema;
  userRoute: UserRouteSchema;
  web_user: WebUserSchema;
}

export namespace ManagerDB {
  export namespace Schema {
    export type BotShardStat = BotShardStatSchema;
    export type DbShard = DbShardSchema;
    export type GuildRoute = GuildRouteSchema;
    export type Session = SessionSchema;
    export type UserRoute = UserRouteSchema;
    export type WebUser = WebUserSchema;
  }

  export type BotShardStat = Selectable<BotShardStatSchema>;
  export type NewBotShardStat = Insertable<BotShardStatSchema>;
  export type BotShardStatUpdate = Updateable<BotShardStatSchema>;

  export type DbShard = Selectable<DbShardSchema>;
  export type NewDbShard = Insertable<DbShardSchema>;
  export type DbShardUpdate = Updateable<DbShardSchema>;

  export type GuildRoute = Selectable<GuildRouteSchema>;
  export type NewGuildRoute = Insertable<GuildRouteSchema>;
  export type GuildRouteUpdate = Updateable<GuildRouteSchema>;

  export type Session = Selectable<SessionSchema>;
  export type NewSession = Insertable<SessionSchema>;
  export type SessionUpdate = Updateable<SessionSchema>;

  export type UserRoute = Selectable<UserRouteSchema>;
  export type NewUserRoute = Insertable<UserRouteSchema>;
  export type UserRouteUpdate = Updateable<UserRouteSchema>;

  export type WebUser = Selectable<WebUserSchema>;
  export type NewWebUser = Insertable<WebUserSchema>;
  export type SessioWebUser = Updateable<WebUserSchema>;
}
