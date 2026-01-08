import { getSharedGuilds } from '$lib/api/shared-guilds.js';
import { hasAccess } from './hasAccess.js';

export async function load(event) {
  const { user } = event.locals.auth();
  const guildData = async () => {
    const { sharedGuilds, listIsComplete, unsharedGuilds } = await getSharedGuilds(event);
    return { shared: sharedGuilds, complete: listIsComplete, unshared: unsharedGuilds };
  };

  return {
    user,
    guilds: guildData(),
    hasAccess: await hasAccess(user.id),
  };
}
