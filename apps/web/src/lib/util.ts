import { getCanonicalUrl } from './redirect';
import type { User } from './server/auth/user';

type AvatarUser = Pick<User, 'id' | 'avatarHash'>;

export function getUserAvatarUrl(user: AvatarUser): string;
export function getUserAvatarUrl(userId: string, avatarHash: string | null): string;
export function getUserAvatarUrl(
  userOrId: string | AvatarUser,
  avatarHash?: string | null,
): string {
  let userId: string;
  let hash: string | null;
  if (typeof userOrId === 'string') {
    userId = userOrId;
    hash = avatarHash as string | null;
  } else {
    userId = userOrId.id;
    hash = userOrId.avatarHash;
  }

  if (hash) {
    return `https://cdn.discordapp.com/avatars/${userId}/${hash}.png`;
  } else {
    // TODO replace placeholder?
    return `https://activityrank.me/favicon.png`;
  }
}

type IconGuild = { id: string; icon: string | null };

export function getGuildIconUrl(guild: IconGuild): string;
export function getGuildIconUrl(guildId: string, iconHash: string | null): string;
export function getGuildIconUrl(guildOrId: string | IconGuild, iconHash?: string | null): string {
  let guildId: string;
  let hash: string | null;
  if (typeof guildOrId === 'string') {
    guildId = guildOrId;
    hash = iconHash as string | null;
  } else {
    guildId = guildOrId.id;
    hash = guildOrId.icon;
  }

  if (hash) {
    return `https://cdn.discordapp.com/icons/${guildId}/${hash}.png`;
  } else {
    // TODO replace placeholder?
    return `https://activityrank.me/favicon.png`;
  }
}

export function getGuildInviteUrl(guildId: string): string {
  return getCanonicalUrl(`/bot-add?guild_id=${guildId}`);
}
