export interface ConfigInstance {
  embedColor: string;
  supportServer: {
    id: string;
    invite: string;
    supportHook: string;
    patreonRoles: { tier: number; id: string }[];
  };
  invite: {
    standard: string;
    admin: string;
  };
  disablePatreon?: boolean;
}

export interface KeyInstance {
  botAuth: string;
  botId: string;
  managerPort: number | null;
  managerApiAuth: string;
  managerDb: {
    dbName: string;
    dbPassword: string;
    dbUser: string;
  };
  managerHost: string;
  shardDb: {
    dbName: string;
    dbPassword: string;
    dbUser: string;
  };
}

const privilegeTypes = ['OWNER', 'DEVELOPER', 'MODERATOR', 'HELPSTAFF'] as const;
export type PrivilegeLevel = (typeof privilegeTypes)[number];

export type PrivilegeInstance = { [k in string]?: PrivilegeLevel };
