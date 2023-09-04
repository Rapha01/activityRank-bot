import 'discord.js';

interface RoleAppData {
  noXp: boolean;
}
interface ClientAppData {
  settings: Record<any, any>;
}

declare module 'discord.js' {
  export interface Role {
    appData: RoleAppData;
  }
  export interface Client {
    appData: ClientAppData;
  }
}
