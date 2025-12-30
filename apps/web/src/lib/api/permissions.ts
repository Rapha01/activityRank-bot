import { PermissionFlagsBits as PermissionFlags } from 'discord-api-types/v10';

export type ApiPermissionLevel = 'OWNER' | 'ADMINISTRATOR' | 'MODERATOR';
export type ExtendedApiPermissionLevel = ApiPermissionLevel | 'MEMBER';

export const API_PERMISSION_NAMES: { [K in ExtendedApiPermissionLevel]: string } = {
  OWNER: 'Server Owner',
  ADMINISTRATOR: 'Administrator',
  MODERATOR: 'Moderator',
  MEMBER: 'Server Member',
};

export function nameApiPermission(key: ExtendedApiPermissionLevel): string {
  return API_PERMISSION_NAMES[key];
}

export function getApiPermissionLevel(
  discordPermissions: string | bigint,
  isGuildOwner: boolean,
): ExtendedApiPermissionLevel {
  const field = bitfield(discordPermissions);

  if (isGuildOwner) return 'OWNER';
  if (field.has(PermissionFlags.Administrator)) return 'ADMINISTRATOR';
  if (field.has(PermissionFlags.ManageGuild)) return 'MODERATOR';
  return 'MEMBER';
}

export function hasManageGuild(permissions: string | bigint): boolean {
  const field = bitfield(permissions);

  return field.has(PermissionFlags.Administrator) || field.has(PermissionFlags.ManageGuild);
}

function bitfield(bits: bigint | string) {
  let bitfield: bigint;

  if (typeof bits === 'string') {
    bitfield = BigInt(bits);
  } else {
    bitfield = bits;
  }

  function any(bit: bigint): boolean {
    return (bitfield & bit) !== 0n;
  }
  function has(bit: bigint): boolean {
    return (bitfield & bit) === bit;
  }
  return { bitfield, any, has };
}
