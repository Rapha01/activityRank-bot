import {
  PermissionFlagsBits as PermissionFlags,
  type RESTAPIPartialCurrentUserGuild,
} from 'discord-api-types/v10';
import { MANAGER_AUTH, MANAGER_HOST } from '$env/static/private';

type APISharedGuildsResponse = {
  guilds: {
    id: string;
    name: string;
    isMember: true;
    permission: 'OWNER' | 'ADMINISTRATOR' | 'MODERATOR' | 'MEMBER';
    icon: string | null;
    banner: string | null;
  }[];
  complete: boolean;
};

export async function load(event) {
  const { session, user } = event.locals.auth();

  const userGuildsResponse = await fetch('https://discord.com/api/v10/users/@me/guilds', {
    headers: { Authorization: `Bearer ${session.accessToken}` },
  });
  const userGuilds: RESTAPIPartialCurrentUserGuild[] = await userGuildsResponse.json();
  const userGuildIds = userGuilds.map((guild) => guild.id);
  const sharedGuildsResponse = await fetch(`http://${MANAGER_HOST}/api/v0/shared-guilds`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${MANAGER_AUTH}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId: user.id, userGuildIds }),
  });
  const sharedGuilds: APISharedGuildsResponse = await sharedGuildsResponse.json();
  const unsharedGuilds = userGuilds
    .filter(
      (guild) =>
        bitfield(guild.permissions).has(PermissionFlags.Administrator) ||
        bitfield(guild.permissions).has(PermissionFlags.ManageGuild),
    )
    .filter((guild) => !sharedGuilds.guilds.some((sharedGuild) => sharedGuild.id === guild.id));

  sharedGuilds.guilds.sort(sortByPermission);
  unsharedGuilds.sort(sortByName);

  return {
    user,
    sharedGuilds: sharedGuilds.guilds,
    listIsComplete: sharedGuilds.complete,
    unsharedGuilds,
  };
}

type SharedGuildSortParams = {
  name: string;
  permission: 'OWNER' | 'ADMINISTRATOR' | 'MODERATOR' | 'MEMBER';
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
