import { manager } from './database';

export async function createUser(user: User) {
  await manager.db
    .insertInto('web_user')
    .values({ id: user.id, username: user.username, avatar_hash: user.avatarHash })
    .execute();
}

export async function updateUserDetails(discordId: string, user: Omit<User, 'id'>) {
  await manager.db
    .updateTable('web_user')
    .set({ username: user.username, avatar_hash: user.avatarHash })
    .where('web_user.id', '=', discordId)
    .execute();
}

export async function getUser(discordId: string): Promise<User | null> {
  const dbUser = await manager.db
    .selectFrom('web_user')
    .select(['id', 'username', 'avatar_hash'])
    .where('web_user.id', '=', discordId)
    .executeTakeFirst();

  if (!dbUser) {
    return null;
  }

  const user: User = {
    id: dbUser.id,
    username: dbUser.username,
    avatarHash: dbUser.avatar_hash,
  };
  return user;
}

/** A User from the `web_user` table. */
export interface User {
  /** The user's Discord ID */
  id: string;
  /** The user's Discord username */
  username: string;
  /** The user's avatar hash on Discord, if any */
  avatarHash: string | null;
}
