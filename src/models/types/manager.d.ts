export interface BotShardStatSchema {
  shardId: number;
  status: number;
  serverCount: number;
  uptimeSeconds: number;
  readyDate: number;
  ip: string;
  changedHealthDate: number;
  commands1h: number;
  botInvites1h: number;
  botKicks1h: number;
  voiceMinutes1h: number;
  textMessages1h: number;
  roleAssignments1h: number;
  rolesDeassignments1h: number;
  changedStatDate: number;
  restartQueued: number;
  commandsTotal: number;
  textMessagesTotal: number;
}

export interface BotStatSchema {
  commands1h: number;
  botInvites1h: number;
  botKicks1h: number;
  voiceMinutes1h: number;
  textMessages1h: number;
  roleAssignments1h: number;
  rolesDeassignments1h: number;
  serverCount: number;
  addDate: number;
}

export interface DbShardSchema {
  id: string;
  hostExtern: string;
  hostIntern: string;
}

export interface GuildRouteSchema {
  guildId: string;
  dbShardId: number;
}

export interface ProductKeySchema {
  key: string;
  type: string;
  userId: string;
  consumeDate: number;
  addDate: number;
}

export interface SettingSchema {
  id: string;
  value: string;
}

export interface UserRouteSchema {
  userId: string;
  dbShardId: number;
}
