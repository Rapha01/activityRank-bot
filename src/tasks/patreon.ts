import { keys } from '../const/keys.js';
import { queryAllHosts } from '../models/shardDb.js';
import { setUser } from '../models/userModel.js';
import { ofetch } from 'ofetch';

const baseURL = new URL(
  'https://www.patreon.com/api/oauth2/v2/campaigns/2925711/members'
);
baseURL.searchParams.set('include', 'user,currently_entitled_tiers');
baseURL.searchParams.set(
  'fields[member]',
  'full_name,last_charge_date,last_charge_status,currently_entitled_amount_cents'
);
baseURL.searchParams.set('fields[tier]', 'amount_cents,created_at,url');
baseURL.searchParams.set('fields[user]', 'social_connections');

const headers = new Headers();
headers.set('Authorization', `Bearer ${keys.patreonAccessToken}`);

export async function runPatreonTask() {
  console.log('[task | patreon] Updating information');

  let nextUrl: null | string = baseURL.href;
  const apiMembers: ParsedMember[] = [];

  while (nextUrl) {
    const res: PatreonResponse = await ofetch<PatreonResponse>(nextUrl, {
      headers,
    });

    apiMembers.push(...getParsedMembers(res));

    if (res.links?.next) nextUrl = res.links.next;
    else nextUrl = null;
  }

  /*
   * Parse Patreon API. Create entitledPledgesWithDiscord array: Contains all currently active pledges with untilDate, tier and discord connection.
   */

  const entitledPledgesWithDiscord: DiscordPledge[] = [];

  for (const member of apiMembers) {
    const pledge = getEntitledMemberPledge(member);
    if (pledge) entitledPledgesWithDiscord.push(pledge);
  }

  /*
   * Update DB. Use activePledges to update DB (if information of pledge and DB differ)
   */

  const usersWithActivePledge = await queryAllHosts<{
    userId: string;
    patreonTier: number;
    patreonTierUntilDate: number;
  }>(
    `SELECT * FROM user WHERE patreonTier > 0 && patreonTierUntilDate > ${
      Date.now() / 1000
    }`
  );

  console.log(`Processing ${entitledPledgesWithDiscord.length} pledges.`);

  for (const pledge of entitledPledgesWithDiscord) {
    let userWithActivePledge = usersWithActivePledge.find(
      (u) => u.userId == pledge.discordUserId
    );

    // Update DB only if new pledge (update different tier only if new untilDate surpasses old untilDate, to avoid manual grant overridings)
    const pledgeSeconds = pledge.until.getTime() / 1000;
    if (
      !userWithActivePledge ||
      pledgeSeconds > userWithActivePledge.patreonTierUntilDate
    ) {
      console.log(
        'UPDATE DB \n oldUser: ',
        userWithActivePledge || 'noActiveTier',
        '\n Pledge: ',
        pledge
      );
      await setUser(pledge.discordUserId, 'patreonTier', pledge.tier);
      await setUser(
        pledge.discordUserId,
        'patreonTierUntilDate',
        pledgeSeconds
      );
    }
  }
}

function getParsedMembers(response: PatreonResponse): ParsedMember[] {
  return response.data.map((member) => {
    const included = response.included.find(
      (inc) => inc.type == 'user' && inc.id == member.relationships.user.data.id
    );
    return { ...member, included };
  });
}

function getMemberTier(member: ParsedMember) {
  const cents = member.attributes.currently_entitled_amount_cents;
  if (cents >= 1449) {
    return 3;
  } else if (cents >= 349) {
    return 2;
  } else if (cents >= 149) {
    return 1;
  } else return null;
}

function getEntitledMemberPledge(member: ParsedMember): DiscordPledge | null {
  const tier = getMemberTier(member);

  // Ignore if not paid.
  if (
    !tier ||
    member.attributes.last_charge_status !== 'Paid' ||
    !member.attributes.last_charge_date
  )
    return null;

  // Set dates
  const untilDate = new Date(member.attributes.last_charge_date);
  untilDate.setDate(untilDate.getDate() + 34);

  // Assign DiscordUserId. Ignore if no Discord connected.
  if (!member.included?.attributes.social_connections?.discord) return null;

  return {
    patreonUserId: member.relationships.user.data.id,
    discordUserId:
      member.included.attributes.social_connections.discord.user_id,
    tier,
    lastCharge: new Date(member.attributes.last_charge_date),
    until: untilDate,
  };
}

type ChargeStatus =
  | 'Paid'
  | 'Declined'
  | 'Deleted'
  | 'Pending'
  | 'Refunded'
  | 'Fraud'
  | 'Other';

interface PatreonResponseData {
  attributes: {
    currently_entitled_amount_cents: number;
    full_name: string;
    last_charge_date: string | null;
    last_charge_status: ChargeStatus | null;
  };
  id: string;
  relationships: {
    currently_entitled_tiers: {
      data: {
        id: string;
        type: 'tier'; //?
      }[];
    };
    user: {
      data: {
        id: string;
        type: 'user';
      };
      links: {
        related: string;
      };
    };
  };
  type: 'member';
}

interface PatreonResponseIncluded {
  attributes: {
    social_connections?: {
      discord: null | {
        scopes: string[] | null;
        url: string | null;
        user_id: string;
      };
      // more connections may exist, including `facebook`, `google`, `spotify`, etc.
    };
  };
  id: string;
  type: string; // typically `user`
}

interface PatreonResponse {
  data: PatreonResponseData[];
  included: PatreonResponseIncluded[];
  links?: {
    next: string;
  };
  meta: {
    pagination: {
      cursors: {
        next: string;
      };
      total: number;
    };
  };
}

interface DiscordPledge {
  patreonUserId: string;
  discordUserId: string;
  tier: number;
  lastCharge: Date;
  until: Date;
}

type ParsedMember = PatreonResponseData & {
  included?: PatreonResponseIncluded;
};
