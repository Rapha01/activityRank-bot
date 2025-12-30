import type { RequestEvent } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import {
  type ExtendedApiPermissionLevel,
  getApiPermissionLevel,
  hasManageGuild,
} from '$lib/api/permissions';
import { userApiHandle } from '$lib/server/discord.js';

type APISharedGuildsResponse = {
  guilds: {
    id: string;
    name: string;
    isMember: true;
    permission: ExtendedApiPermissionLevel;
    icon: string | null;
    banner: string | null;
  }[];
  complete: boolean;
};

export async function getSharedGuilds(event: RequestEvent) {
  const { session, user } = event.locals.auth();

  // TODO: cache this? (probably in a cookie)
  const userGuilds = await userApiHandle(session).users.getGuilds();
  const userGuildIds = userGuilds.map((guild) => guild.id);

  // TODO(@piemot): cache this result on the API end
  const sharedGuildsResponse = await fetch(`http://${env.MANAGER_HOST}/api/v0/shared-guilds`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.MANAGER_AUTH}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId: user.id, userGuildIds }),
  });
  const sharedGuilds: APISharedGuildsResponse = await sharedGuildsResponse.json();

  const unsharedGuilds = userGuilds
    .filter((userGuild) => hasManageGuild(userGuild.permissions))
    .filter((userGuild) => !sharedGuilds.guilds.some((botGuild) => botGuild.id === userGuild.id))
    .map((userGuild) => ({
      ...userGuild,
      apiPermission: getApiPermissionLevel(userGuild.permissions, userGuild.owner),
    }));

  sharedGuilds.guilds.sort(sortByPermission);
  unsharedGuilds.sort(sortByName);

  return {
    listIsComplete: sharedGuilds.complete,
    sharedGuilds: sharedGuilds.guilds,
    unsharedGuilds,
    userGuilds,
  };
}

type SharedGuildSortParams = {
  name: string;
  permission: ExtendedApiPermissionLevel;
};

function sortByPermission(a: SharedGuildSortParams, b: SharedGuildSortParams): number {
  const ordering = {
    OWNER: 3,
    ADMINISTRATOR: 2,
    MODERATOR: 1,
    MEMBER: 0,
  };

  if (a.permission !== b.permission) {
    // greatest to least
    return ordering[b.permission] - ordering[a.permission];
  } else {
    return sortByName(a, b);
  }
}

function sortByName(a: { name: string }, b: { name: string }): number {
  // sensitivity: 'base' ignores case
  return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
}
