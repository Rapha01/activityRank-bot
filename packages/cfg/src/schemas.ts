import { z } from 'zod/v4';

const snowflake = z
  .string()
  .regex(/^\d{17,20}$/)
  .meta({
    id: 'Snowflake',
    description:
      'A Discord ["Snowflake"](https://discord.com/developers/docs/reference#snowflakes), represented as a string.',
    examples: ['774660568728469585', '1398036663078486047', '905898879785005106'],
  });

const dbConnection = z.object({
  dbUser: z.string().meta({
    description: 'The username to use while connecting to the database',
    example: 'activityrank',
  }),
  dbPassword: z
    .string()
    .meta({ description: 'The password to use while connecting to the database' }),
  dbName: z
    .string()
    .meta({ description: 'The name of the database to connect to', example: 'dbShard' }),
});

export const config = z.object({
  supportServer: z.object({
    id: snowflake,
    invite: z.url().meta({
      description: 'The Discord invite URL to add members to the support server',
      example: 'https://discordapp.com/invite/DE3eQ8H',
    }),
    patreonRoles: z.array(z.object({ id: snowflake, tier: z.int().min(0) })),
    // TODO: use this for Discord native supporters
    supporterRole: z.object({ id: snowflake.optional() }).optional(),
    supportHook: z.url().optional(),
  }),
  invites: z
    .strictObject({
      standard: z.url().meta({
        description:
          "The Discord OAuth URL to add the bot to a user's server with a minimal set of permissions.",
      }),
      admin: z.url().meta({
        description:
          "The Discord OAuth URL to add the bot to a user's server with a larger set of permissions.",
      }),
    })
    .meta({ description: "The Discord OAuth URLs to add the bot to a user's server." }),
  disablePatreon: z.boolean().optional().default(false),
  developmentServers: z.array(snowflake).meta({
    description: 'The IDs of servers in which to register development commands',
    uniqueItems: true,
  }),
});

export const keys = z.object({
  /**The Discord token of the bot*/
  botAuth: z.string().describe('The Discord token of the bot'),
  /**The Discord ID of the bot*/
  botId: snowflake.describe('The Discord ID of the bot'),
  /**The Discord Bot List API key*/
  dblApiKey: z.string().describe('The Discord Bot List API key'),
  /**The Patreon API token*/
  patreonAccessToken: z.string().describe('The Patreon API token'),
  /**The token required by the Manager API*/
  managerApiAuth: z.string().describe('The token required by the Manager API'),
  /**The host of the internal API*/
  managerApiHost: z.string().describe('The host of the internal API'),
  /**The port of the internal API*/
  managerApiPort: z.int().gt(0).lte(65535).optional().describe('The port of the internal API'),
  /**The host of the Manager Database*/
  managerHost: z.string().describe('The host of the Manager Database'),
  /**Properties concerning manager DB connections*/
  managerDb: dbConnection.describe('Properties concerning manager DB connections'),
  /**Properties concerning shard DB connections*/
  shardDb: dbConnection.describe('Properties concerning shard DB connections'),
});

export const botConfig = config.pick({
  developmentServers: true,
  invites: true,
  supportServer: true,
});

export const botKeys = keys.pick({
  botAuth: true,
  botId: true,
  managerApiAuth: true,
  managerApiHost: true,
  managerApiPort: true,
  managerDb: true,
  managerHost: true,
  shardDb: true,
});

export const apiConfig = config.pick({
  disablePatreon: true,
});

export const apiKeys = keys.pick({
  botId: true,
  managerApiAuth: true,
  patreonAccessToken: true,
  dblApiKey: true,
  managerHost: true,
  managerDb: true,
  shardDb: true,
});

/**The users that are able to use privileged commands*/
export const privileges = z
  .record(snowflake, z.enum(['DEVELOPER', 'MODERATOR', 'HELPSTAFF']))
  .describe('The users that are able to use privileged commands');

/**A record of bot emoji names to IDs*/
export const emojis = z
  .record(z.string(), snowflake)
  .describe('A record of bot emoji names to IDs');

/**
 * @deprecated
 *
 * The basic config to be provided to the Manager module of ActivityRank*/
export const managerConfig = z
  .object({ disablePatreon: z.boolean().optional() })
  .describe('The basic config to be provided to the Manager module of ActivityRank');

/**
 * @deprecated
 *
 * The keys to be provided to the Manager module of ActivityRank */
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

// preset schemas
export const bot = {
  config: botConfig,
  keys: botKeys,
  privileges,
  emojis,
};

/** @deprecated (use api instead) */
export const manager = {
  config: managerConfig,
  keys: managerKeys,
};

export const api = {
  config: apiConfig,
  keys: apiKeys,
};
