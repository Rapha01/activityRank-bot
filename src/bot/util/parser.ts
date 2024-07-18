/*
.addChannelOption(o => o
  .setName('channel').setDescription('The channel to modify')
  .addChannelTypes([GuildText, GuildVoice]))
.addStringOption(o => o
  .setName('id').setDescription('The ID of the channel to modify'));
*/

import type { ChatInputCommandInteraction, GuildBasedChannel, Role, GuildMember } from 'discord.js';

export enum ParserResponseStatus {
  /** Successfully parsed the desired object. */
  Success,
  /** The user has provided different objects in the `id` and `object` fields. */
  ConflictingInputs,
  /** The user has not provided an object in either the `id` or `object` fields. */
  NoInput,
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
  } else if (id) {
    return { object: undefined, id, status: ParserResponseStatus.Success };
  } else {
    throw new Error('unreachable');
  }
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
