import { z } from 'zod';

// ! PARTIALLY GENERATED with npm:json-schema-to-zod -i <input-file> -o <output-file> -wj

const color = z.union([
  z.string().regex(/^#?([a-f0-9]{6}|[a-f0-9]{3})$/),
  z.number().gte(0).lte(0xffffff),
]);

const supportServer = z.object({
  id: z.string(),
  invite: z.string(),
  supportHook: z.string().url().optional(),
  patreonRoles: z.array(z.object({ id: z.string(), tier: z.number().int() })),
});

const dbConnection = z.object({
  dbUser: z.string().describe('The username to use while connecting to the database'),
  dbPassword: z.string().describe('The password to use while connecting to the database'),
  dbName: z.string().describe('The name of the database to connect to'),
});

/**The basic config to be provided to the Bot module of ActivityRank*/
export const botConfig = z
  .object({
    embedColor: color.optional(),
    supportServer: supportServer.strict(),
    invite: z.object({ standard: z.string(), admin: z.string().optional() }).strict(),
    disablePatreon: z.boolean().optional(),
    /**The IDs of servers in which to register development commands*/
    developmentServers: z
      .array(z.string())
      .describe('The IDs of servers in which to register development commands'),
  })
  .describe('The basic config to be provided to the Bot module of ActivityRank');

/** The keys to be provided to the Bot module of ActivityRank */
export const botKeys = z
  .object({
    /**The Discord token of the bot*/
    botAuth: z.string().describe('The Discord token of the bot'),
    /**The Discord ID of the bot*/
    botId: z.string().describe('The Discord ID of the bot'),
    /**The password required by the Manager API*/
    managerApiAuth: z.string().describe('The password required by the Manager API'),
    /**The host of the Manager API*/
    managerHost: z.string().describe('The host of the Manager API'),
    /**The port of the Manager API*/
    managerPort: z.number().gt(0).lte(65535).nullable().describe('The port of the Manager API'),
    /**Properties concerning manager DB connections*/
    managerDb: dbConnection.describe('Properties concerning manager DB connections'),
    /**Properties concerning shard DB connections*/
    shardDb: dbConnection.describe('Properties concerning shard DB connections'),
  })
  .describe('The keys to be provided to the Bot module of ActivityRank');

/**The users that are able to use privileged commands*/
export const privileges = z
  .record(z.string().regex(/^\d+$/), z.enum(['DEVELOPER', 'MODERATOR', 'HELPSTAFF']))
  .describe('The users that are able to use privileged commands');

/**A record of bot emoji names to IDs*/
export const emojis = z
  .record(z.string(), z.string().regex(/\d{17,20}/))
  .describe('A record of bot emoji names to IDs');

/**The basic config to be provided to the Manager module of ActivityRank*/
export const managerConfig = z
  .object({ disablePatreon: z.boolean().optional() })
  .describe('The basic config to be provided to the Manager module of ActivityRank');

/** The keys to be provided to the Manager module of ActivityRank */
export const managerKeys = z
  .object({
    /**The Discord ID of the bot*/
    botId: z.string().describe('The Discord ID of the bot'),
    /**The Discord Bot List API key*/
    dblApiKey: z.string().describe('The Discord Bot List API key'),
    /**The Patreon API token*/
    patreonAccessToken: z.string().describe('The Patreon API token'),
    /**The password required by the Manager API*/
    managerApiAuth: z.string().describe('The password required by the Manager API'),
    /**The host of the Manager DB*/
    managerHost: z.string().describe('The host of the Manager DB'),
    /**Properties concerning manager DB connections*/
    managerDb: dbConnection.describe('Properties concerning manager DB connections'),
    /**Properties concerning shard DB connections*/
    shardDb: dbConnection.describe('Properties concerning shard DB connections'),
  })
  .describe('The keys to be provided to the Manager module of ActivityRank');

/**The basic config to be provided to the API module of ActivityRank*/
export const apiConfig = z
  .object({})
  .describe('The basic config to be provided to the API module of ActivityRank');

/** The keys to be provided to the API module of ActivityRank */
export const apiKeys = z
  .object({
    /**The password required by the Manager API*/
    managerApiAuth: z.string().describe('The password required by the Manager API'),
    /**The host of the Manager DB*/
    managerHost: z.string().describe('The host of the Manager DB'),
    /**Properties concerning manager DB connections*/
    managerDb: dbConnection.describe('Properties concerning manager DB connections'),
    /**Properties concerning shard DB connections*/
    shardDb: dbConnection.describe('Properties concerning shard DB connections'),
  })
  .describe('The keys to be provided to the API module of ActivityRank');

// preset schemas
export const bot = {
  config: botConfig,
  keys: botKeys,
  privileges,
  emojis,
};

export const manager = {
  config: managerConfig,
  keys: managerKeys,
};

export const api = {
  config: apiConfig,
  keys: apiKeys,
};
