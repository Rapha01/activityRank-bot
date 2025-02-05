import { z } from 'zod';
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ApplicationIntegrationType,
  ChannelType,
  InteractionContextType,
} from 'discord-api-types/v10';

function canParseBigInt(val: string): boolean {
  try {
    BigInt(val);
    return true;
  } catch {
    return false;
  }
}

const default_member_permissions = z
  .string()
  .refine(canParseBigInt, { message: 'default_member_permissions must be parseable to a BigInt.' })
  .nullable();

const NAME_REGEX = /^[-_\p{L}\p{N}\p{sc=Deva}\p{sc=Thai}]{1,32}$/u;
const baseOptionSchema = z.object({
  name: z.string().regex(NAME_REGEX),
  // check `description` in translations
  required: z.boolean().optional().default(false),
});

const choiceSchema = <T extends z.ZodTypeAny>(t: T) =>
  z.array(z.object({ name: z.string().min(1).max(100), value: t })).max(25);

export const basicOptionSchema = z.union([
  baseOptionSchema.extend({
    type: z.union([
      z.literal(ApplicationCommandOptionType.Boolean),
      z.literal(ApplicationCommandOptionType.User),
      z.literal(ApplicationCommandOptionType.Role),
      z.literal(ApplicationCommandOptionType.Mentionable),
      z.literal(ApplicationCommandOptionType.Attachment),
    ]),
  }),
  baseOptionSchema.extend({
    type: z.literal(ApplicationCommandOptionType.Channel),
    channel_types: z.array(z.nativeEnum(ChannelType)).optional(),
  }),
  baseOptionSchema.extend({
    type: z.literal(ApplicationCommandOptionType.String),
    min_length: z.number().int().min(0).max(6000).optional(),
    max_length: z.number().int().min(1).max(6000).optional(),
    autocomplete: z.literal(true),
  }),
  baseOptionSchema.extend({
    type: z.literal(ApplicationCommandOptionType.String),
    min_length: z.number().int().min(0).max(6000).optional(),
    max_length: z.number().int().min(1).max(6000).optional(),
    autocomplete: z.literal(false).optional(),
    choices: choiceSchema(z.string().min(1).max(100)).optional(),
  }),
  baseOptionSchema.extend({
    type: z.literal(ApplicationCommandOptionType.Integer),
    min_value: z.number().int().optional(),
    max_value: z.number().int().optional(),
    autocomplete: z.literal(true),
  }),
  baseOptionSchema.extend({
    type: z.literal(ApplicationCommandOptionType.Integer),
    min_value: z.number().int().optional(),
    max_value: z.number().int().optional(),
    autocomplete: z.literal(false).optional(),
    choices: choiceSchema(z.number().int()).optional(),
  }),
  baseOptionSchema.extend({
    type: z.literal(ApplicationCommandOptionType.Number),
    min_value: z.number().optional(),
    max_value: z.number().optional(),
    autocomplete: z.literal(true),
  }),
  baseOptionSchema.extend({
    type: z.literal(ApplicationCommandOptionType.Number),
    min_value: z.number().optional(),
    max_value: z.number().optional(),
    autocomplete: z.literal(false).optional(),
    choices: choiceSchema(z.number()).optional(),
  }),
]);

export const subcommandOptionSchema = baseOptionSchema.extend({
  type: z.literal(ApplicationCommandOptionType.Subcommand),
  options: z.array(basicOptionSchema).min(1).max(25).optional(),
});

export const subcommandGroupOptionSchema = baseOptionSchema.extend({
  type: z.literal(ApplicationCommandOptionType.SubcommandGroup),
  options: z.array(subcommandOptionSchema).min(1).max(25),
});

export const anyOptionSchema = z.union([
  basicOptionSchema,
  subcommandOptionSchema,
  subcommandGroupOptionSchema,
]);

export const chatInputCommandSchema = z.object({
  name: z.string().regex(NAME_REGEX),
  // check `description` in translations
  type: z.literal(ApplicationCommandType.ChatInput),
  default_member_permissions,
  integration_types: z.array(z.nativeEnum(ApplicationIntegrationType)).optional(),
  contexts: z.array(z.nativeEnum(InteractionContextType)).optional(),
  options: z
    .union([
      z.array(basicOptionSchema).min(0).max(25),
      z
        .array(z.union([subcommandOptionSchema, subcommandGroupOptionSchema]))
        .min(0)
        .max(25),
    ])
    .optional(),
});

export const contextCommandSchema = z.object({
  name: z.string().min(1).max(32),
  // check `description` in translations
  type: z.union([
    z.literal(ApplicationCommandType.Message),
    z.literal(ApplicationCommandType.User),
  ]),
  default_member_permissions,
  integration_types: z.array(z.nativeEnum(ApplicationIntegrationType)).optional(),
  contexts: z.array(z.nativeEnum(InteractionContextType)).optional(),
});

export const commandsSchema = z.array(z.union([chatInputCommandSchema, contextCommandSchema]));
