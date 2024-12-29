import { z } from 'zod';

// ! GENERATED with npm:json-schema-to-zod -i <input-file> -o <output-file> -wj

/**The basic config to be provided to the Bot module of ActivityRank*/
export const botConfig = z
  .object({
    embedColor: z
      .any()
      .superRefine((x, ctx) => {
        const schemas = [
          z.string().regex(/^#?([a-f0-9]{6}|[a-f0-9]{3})$/),
          z.number().gte(0).lte(16777215),
          z.array(z.any()),
        ];
        const errors = schemas.reduce<z.ZodError[]>(
          (errors, schema) =>
            ((result) => (result.error ? [...errors, result.error] : errors))(schema.safeParse(x)),
          [],
        );
        if (schemas.length - errors.length !== 1) {
          ctx.addIssue({
            path: ctx.path,
            code: 'invalid_union',
            unionErrors: errors,
            message: 'Invalid input: Should pass single schema',
          });
        }
      })
      .optional(),
    supportServer: z.any().optional(),
    invite: z
      .object({ standard: z.string().optional(), admin: z.string().optional() })
      .strict()
      .optional(),
    disablePatreon: z.boolean().optional(),
    /**The IDs of servers in which to register development commands*/
    developmentServers: z
      .array(z.string())
      .describe('The IDs of servers in which to register development commands'),
  })
  .strict()
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
    managerPort: z
      .any()
      .superRefine((x, ctx) => {
        const schemas = [z.number().lte(65535), z.null()];
        const errors = schemas.reduce<z.ZodError[]>(
          (errors, schema) =>
            ((result) => (result.error ? [...errors, result.error] : errors))(schema.safeParse(x)),
          [],
        );
        if (schemas.length - errors.length !== 1) {
          ctx.addIssue({
            path: ctx.path,
            code: 'invalid_union',
            unionErrors: errors,
            message: 'Invalid input: Should pass single schema',
          });
        }
      })
      .describe('The port of the Manager API'),
    /**Properties concerning manager DB connections*/
    managerDb: z.any().describe('Properties concerning manager DB connections'),
    /**Properties concerning shard DB connections*/
    shardDb: z.any().describe('Properties concerning shard DB connections'),
  })
  .strict()
  .describe('The keys to be provided to the Bot module of ActivityRank');

/**The users that are able to use privileged commands*/
export const privileges = z
  .record(z.union([z.enum(['DEVELOPER', 'MODERATOR', 'HELPSTAFF']), z.never()]))
  .superRefine((value, ctx) => {
    for (const key in value) {
      let evaluated = false;
      if (key.match(/^\d+$/)) {
        evaluated = true;
        const result = z.enum(['DEVELOPER', 'MODERATOR', 'HELPSTAFF']).safeParse(value[key]);
        if (!result.success) {
          ctx.addIssue({
            path: [...ctx.path, key],
            code: 'custom',
            message: `Invalid input: Key matching regex /${key}/ must match schema`,
            params: {
              issues: result.error.issues,
            },
          });
        }
      }
      if (!evaluated) {
        const result = z.never().safeParse(value[key]);
        if (!result.success) {
          ctx.addIssue({
            path: [...ctx.path, key],
            code: 'custom',
            message: 'Invalid input: must match catchall schema',
            params: {
              issues: result.error.issues,
            },
          });
        }
      }
    }
  })
  .describe('The users that are able to use privileged commands');

// preset schemas
export const bot = {
  config: botConfig,
  keys: botKeys,
  privileges,
};
// TODO create designated manager schemas
export const manager = {
  config: botConfig,
  keys: botKeys,
};
