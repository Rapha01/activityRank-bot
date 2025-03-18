import {
  RESTJSONErrorCodes,
  type ChatInputCommandInteraction,
  type GuildBasedChannel,
  type Role,
  type GuildMember,
  DiscordAPIError,
  type Interaction,
  Guild,
  type User,
} from 'discord.js';
import { assertUnreachableUnsafe } from './typescript.js';

export enum ParserResponseStatus {
  /** Successfully parsed the desired object. */
  Success = 0,
  /** The user has provided different objects in the `id` and `object` fields. */
  ConflictingInputs = 1,
  /** The user has not provided an object in either the `id` or `object` fields. */
  NoInput = 2,
}

type ParsedResponse<T> =
  | { status: ParserResponseStatus.Success; object: T | undefined; id: string }
  | { status: ParserResponseStatus.ConflictingInputs }
  | { status: ParserResponseStatus.NoInput };

function parseObject<T>(
  interaction: ChatInputCommandInteraction<'cached'>,
  objectKey: string,
  getObject: (s: string) => T | undefined,
): ParsedResponse<T> {
  const objectId = interaction.options.get(objectKey)?.value?.toString();
  const id = interaction.options.getString('id');

  if (!objectId && !id) return { status: ParserResponseStatus.NoInput };
  if (objectId && id) {
    // both options are provided, but don't match
    if (objectId !== id) return { status: ParserResponseStatus.ConflictingInputs };
  }

  if (objectId) {
    return { object: getObject(objectId), id: objectId, status: ParserResponseStatus.Success };
  }
  if (id) {
    return { object: getObject(id), id, status: ParserResponseStatus.Success };
  }
  assertUnreachableUnsafe();
}

export function parseChannel(
  interaction: ChatInputCommandInteraction<'cached'>,
): ParsedResponse<GuildBasedChannel> {
  return parseObject(interaction, 'channel', (id) => interaction.guild.channels.cache.get(id));
}

export function parseRole(
  interaction: ChatInputCommandInteraction<'cached'>,
): ParsedResponse<Role> {
  return parseObject(interaction, 'role', (id) => interaction.guild.roles.cache.get(id));
}

export function parseMember(
  interaction: ChatInputCommandInteraction<'cached'>,
): ParsedResponse<GuildMember> {
  return parseObject(interaction, 'member', (id) => interaction.guild.members.cache.get(id));
}

/**
 * Produces a GuildMember from a User and a guild-containing context - either a Guild or an Interaction.
 * @returns null if the User is not in the resolved Guild, or if no User is provided
 * @throws if a guild cannot be resolved from the provided `context`.
 */
export async function resolveMember(
  user: User | null | undefined,
  context: Guild | Interaction,
): Promise<GuildMember | null> {
  if (!user) return null;

  let guild: Guild;
  if (context instanceof Guild) {
    guild = context;
  } else {
    if (context.guild) {
      guild = context.guild;
    } else {
      throw new Error('Failed to resolve member: interaction run outside of a guild');
    }
  }
  return await guild.members.fetch(user).catch(catchDjsError(RESTJSONErrorCodes.UnknownMember));
}

/**
 * Used inside a `.catch()` block of an errorable Discord.JS request.
 * @param code The RESTJSONErrorCode to ignore
 * @returns null
 * @throws an error if the `code` is not matched
 *
 * @example ```ts
 * const member: GuildMember | null = await interaction.guild.members
 *            .fetch(user)
 *            .catch(catchDjsError(RESTJSONErrorCodes.UnknownUser));
 * ```
 */
export function catchDjsError(code: RESTJSONErrorCodes): (err: unknown) => null {
  return (err: unknown) => {
    if (err instanceof DiscordAPIError && err.code === code) {
      return null;
    }
    throw err;
  };
}
