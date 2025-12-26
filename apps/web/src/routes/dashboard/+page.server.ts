import { getSharedGuilds } from '$lib/api/shared-guilds.js';

export async function load(event) {
  const { user } = event.locals.auth();
  const { sharedGuilds, listIsComplete, unsharedGuilds } = await getSharedGuilds(event);

  return {
    user,
    sharedGuilds,
    listIsComplete,
    unsharedGuilds,
  };
}
