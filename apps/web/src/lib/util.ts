import type { User } from './server/auth/user';

export function getUserAvatarUrl(user: User): string;
export function getUserAvatarUrl(userId: string, avatarHash: string): string;
export function getUserAvatarUrl(userOrId: string | User, avatarHash?: string): string {
  if (typeof userOrId === 'string') {
    return `https://cdn.discordapp.com/avatars/${userOrId}/${avatarHash}.png`;
  }
  return `https://cdn.discordapp.com/avatars/${userOrId.id}/${userOrId.avatarHash}.png`;
}
