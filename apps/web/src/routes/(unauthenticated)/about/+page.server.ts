import { env } from '$env/dynamic/private';
import { discordBotApiHandle } from '$lib/server/discord';

type SocialInfo = { type: 'GITHUB'; username: string };

interface BaseStaffInfo {
  name: string;
  username: string;
  discordId: string;
  pronouns?: string;
  role: string;
  socials: SocialInfo[];
}

export type StaffInfo = BaseStaffInfo & { avatarUrl: string };

const STAFF: BaseStaffInfo[] = [
  {
    name: 'piemot',
    username: 'piemot',
    discordId: '774660568728469585',
    pronouns: 'she / her',
    role: 'Lead Developer',
    socials: [{ type: 'GITHUB', username: 'piemot' }],
  },
  {
    name: 'Rapha',
    username: 'rapha01',
    discordId: '370650814223482880',
    pronouns: 'he / him',
    role: 'Owner & Former Developer',
    socials: [{ type: 'GITHUB', username: 'rapha01' }],
  },
  {
    name: 'GeheimerWolf',
    username: 'geheimerwolf',
    discordId: '270273690074087427',
    pronouns: 'he / him',
    role: 'CUSTOM',
    socials: [],
  },
  {
    name: 'LiviD',
    username: 'reezilo',
    discordId: '181725637940084736',
    pronouns: 'he / him',
    role: 'Support Staff',
    socials: [],
  },
  {
    name: 'RyXy',
    username: 'ryxy._.',
    discordId: '686422759365935105',
    role: 'Support Staff',
    socials: [],
  },
];

// very carefully ignoring the info in https://svelte.dev/docs/kit/state-management
// in this case, it's fine because it's public and intentionally-shared data.
let users: null | StaffInfo[] = null;
let lastUpdate: Date = new Date();

const REFRESH_AFTER = 1000 * 60 * 60; // 60 minutes

export async function load(): Promise<{ staff: StaffInfo[] }> {
  const timeDifference = Date.now() - lastUpdate.getTime();
  if (users && timeDifference < REFRESH_AFTER) {
    return { staff: users };
  }

  console.log('Updating staff index');

  const headers = new Headers();
  headers.set('Authorization', `Bot ${env.DISCORD_TOKEN}`);

  async function extendStaffInfo(user: BaseStaffInfo): Promise<StaffInfo> {
    const discordUser = await discordBotApiHandle.users.get(user.discordId);

    return {
      ...user,
      avatarUrl: `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`,
    };
  }

  users = await Promise.all(STAFF.map(extendStaffInfo));
  lastUpdate = new Date();
  return { staff: users };
}
