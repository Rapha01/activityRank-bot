import { z } from 'zod/v4';

const snowflake = z
  .string()
  .regex(/^\d{17,20}$/)
  .meta({
    id: 'Snowflake',
    description:
      'A Discord "Snowflake" (<https://discord.com/developers/docs/reference#snowflakes>), represented as a string.',
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
  supportServer: z
    .object({
      id: snowflake.meta({ description: 'The Discord ID of the support server' }),
      invite: z.url().meta({
        description: 'The Discord invite URL to add members to the support server',
        example: 'https://discordapp.com/invite/DE3eQ8H',
      }),
      patreonRoles: z.array(z.object({ id: snowflake, tier: z.int().min(0) })).meta({
        description:
          'A list of roles to give Patreon subscribers in the support server, and the corresponding tiers',
        example: '[{ id: "774660568728469585", tier: 1 }, { id: "905898879785005106", tier: 2 }]',
      }),
      // TODO: use this for Discord native supporters
      supporterRole: z.object({ id: snowflake.optional() }).optional().meta({
        description:
          'The role to give members that have purchased a subscription in the support server.',
        example: '{ id: "774660568728469585" }',
      }),
    })
    .meta({
      description: 'Details about the Support Server - like invite links and Premium roles',
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
    .meta({
      title: 'Links to invite the bot',
      description: "The Discord OAuth URLs to add the bot to a user's server.",
    }),
  patreon: z
    .object({
      tiers: z.array(
        z.object({ tier: z.int(), id: z.string().regex(/^\d+$/), discordRole: snowflake }).meta({
          description:
            'A Patreon tier and its corresponding Patreon ID and Discord Supporter Role ID',
        }),
      ),
    })
    .nullable()
    .meta({ description: 'Settings for the Patreon integration' }),
  disablePatreon: z.boolean().optional().default(false).meta({
    description:
      'Whether to disable Patreon-related features like role updates and Patreon API queries.',
  }),
  developmentServers: z.array(snowflake).meta({
    description: 'The IDs of servers in which to register development commands',
    uniqueItems: true,
  }),
  emoji: z.record(z.string(), snowflake).describe('A record matching bot emoji names to emoji IDs'),
  staffEntitlements: z
    .record(
      snowflake,
      z
        .enum(['DEVELOPER', 'MODERATOR', 'HELPSTAFF'])
        .meta({ description: 'The level of entitlement the staff member should have' }),
    )
    .describe('The users that are able to use restricted commands'),
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
  /**A proxy server to route Discord REST API requests through*/
  proxy: z.url().nullable().describe('A proxy server to route Discord REST API requests through'),
});

export const botConfig = config.pick({
  developmentServers: true,
  invites: true,
  supportServer: true,
  disablePatreon: true,
  emoji: true,
  staffEntitlements: true,
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
  proxy: true,
});

export const apiConfig = config.pick({
  patreon: true,
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

// preset schemas
export const bot = {
  config: botConfig,
  keys: botKeys,
};

export const api = {
  config: apiConfig,
  keys: apiKeys,
};
