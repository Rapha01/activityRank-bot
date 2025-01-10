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

export interface BotStatSchema {
  commands1h: Generated<number>;
  botInvites1h: Generated<number>;
  botKicks1h: Generated<number>;
  voiceMinutes1h: Generated<number>;
  textMessages1h: Generated<number>;
  roleAssignments1h: Generated<number>;
  rolesDeassignments1h: Generated<number>;
  serverCount: Generated<number>;
  addDate: Generated<number>;
}

export interface DbShardSchema {
  id: Generated<string>;
  host: Generated<string>;
}

export interface GuildRouteSchema {
  guildId: Generated<string>;
  dbShardId: Generated<number>;
}

export interface ProductKeySchema {
  key: string;
  type: Generated<string>;
  userId: Generated<string>;
  consumeDate: Generated<number>;
  addDate: Generated<number>;
}

export interface SettingSchema {
  id: string;
  value: Generated<string>;
}

export interface UserRouteSchema {
  userId: Generated<string>;
  dbShardId: Generated<number>;
}

export interface ManagerDB {
  botShardStat: BotShardStatSchema;
  botStat: BotStatSchema;
  dbShard: DbShardSchema;
  guildRoute: GuildRouteSchema;
  productKey: ProductKeySchema;
  setting: SettingSchema;
  userRoute: UserRouteSchema;
}

export namespace ManagerDB {
  export namespace Schema {
    export type BotShardStat = BotShardStatSchema;
    export type BotStat = BotStatSchema;
    export type DbShard = DbShardSchema;
    export type GuildRoute = GuildRouteSchema;
    export type ProductKey = ProductKeySchema;
    export type Setting = SettingSchema;
    export type UserRoute = UserRouteSchema;
  }

  export type BotShardStat = Selectable<BotShardStatSchema>;
  export type NewBotShardStat = Insertable<BotShardStatSchema>;
  export type BotShardStatUpdate = Updateable<BotShardStatSchema>;

  export type BotStat = Selectable<BotStatSchema>;
  export type NewBotStat = Insertable<BotStatSchema>;
  export type BotStatUpdate = Updateable<BotStatSchema>;

  export type DbShard = Selectable<DbShardSchema>;
  export type NewDbShard = Insertable<DbShardSchema>;
  export type DbShardUpdate = Updateable<DbShardSchema>;

  export type GuildRoute = Selectable<GuildRouteSchema>;
  export type NewGuildRoute = Insertable<GuildRouteSchema>;
  export type GuildRouteUpdate = Updateable<GuildRouteSchema>;

  export type ProductKey = Selectable<ProductKeySchema>;
  export type NewProductKey = Insertable<ProductKeySchema>;
  export type ProductKeyUpdate = Updateable<ProductKeySchema>;

  export type Setting = Selectable<SettingSchema>;
  export type NewSetting = Insertable<SettingSchema>;
  export type SettingUpdate = Updateable<SettingSchema>;

  export type UserRoute = Selectable<UserRouteSchema>;
  export type NewUserRoute = Insertable<UserRouteSchema>;
  export type UserRouteUpdate = Updateable<UserRouteSchema>;
}
