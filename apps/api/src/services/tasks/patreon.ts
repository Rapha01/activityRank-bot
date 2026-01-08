import { backOff } from 'exponential-backoff';
import z from 'zod';
import { config, keys } from '#const/config.ts';
import { shards } from '#models/shard.ts';
import { updateUser } from '#models/user.ts';

const baseURL = new URL('https://www.patreon.com/api/oauth2/v2/campaigns/2925711/members');
baseURL.searchParams.set('include', 'user,currently_entitled_tiers');
baseURL.searchParams.set('fields[member]', 'full_name,last_charge_date,last_charge_status');
baseURL.searchParams.set('fields[user]', 'social_connections');

const headers = new Headers();
headers.set('Authorization', `Bearer ${keys.patreonAccessToken}`);

class FetchError extends Error {
  code: number;

  constructor(message: string, code: number, cause: unknown) {
    super(message, { cause });
    this.name = 'FetchError';
    this.code = code;
  }
}

export async function runPatreonTask() {
  console.log('[task | patreon] Updating information');

  let nextUrl: string = baseURL.href;
  const premiumUsers: PremiumData[] = [];

  while (true) {
    const res = await backOff(
      async () => {
        const fetched = await fetch(nextUrl, { headers });
        if (!fetched.ok) {
          throw new FetchError(
            `Failed to fetch Patreon URL (${fetched.status} ${fetched.statusText}) "${nextUrl}"`,
            fetched.status,
            fetched,
          );
        }
        const json = await fetched.json().catch((cause) => {
          throw new Error(`Failed to parse Patreon result from "${nextUrl}"`, { cause });
        });
        return json;
      },
      // Only retry on FetchError and a non-4xx error code
      {
        retry: (e) => e instanceof FetchError && (e.code < 400 || e.code >= 500),
        numOfAttempts: 3,
        startingDelay: 10_000,
      },
    );
    const response = PatreonResponse.parse(res);

    for (const member of response.data) {
      const premiumMember = parseMember(member, response.included);
      if (premiumMember) {
        premiumUsers.push(premiumMember);
      }
    }

    // sleep to try to avoid 429 errors
    await new Promise((r) => setTimeout(r, 1000));

    if (response.links?.next) {
      nextUrl = response.links.next;
    } else {
      break;
    }
  }

  // Update DB. Use premiumUsers to update DB (if information of Patreon user and DB differ)
  const usersWithActivePledge = await shards.executeOnAllHosts((db) =>
    db
      .selectFrom('user')
      .selectAll()
      .where('patreonTier', '>', 0)
      .where('patreonTierUntilDate', '>', Math.floor(Date.now() / 1000).toString())
      .execute(),
  );

  console.log(`Processing ${premiumUsers.length} Patreon users.`);

  // for each Patreon subscriber, find the relevant db user.
  for (const patreonUser of premiumUsers) {
    const dbUser = usersWithActivePledge.find((u) => u.userId === patreonUser.discordUserId);

    const endsAtSeconds = patreonUser.until.getTime() / 1000;

    // If the user does not exist yet in the database, or if the pledge time
    // given by Patreon is greater than the current pledge time, update the user.
    // If the pledge given by Patreon is less useful, do _not_ update, to avoid
    // disrupting grants that may have been given manually in the database.
    if (dbUser && endsAtSeconds < Number.parseInt(dbUser.patreonTierUntilDate)) {
      continue;
    }

    await updateUser(patreonUser.discordUserId, {
      patreonTier: patreonUser.tier,
      patreonTierUntilDate: endsAtSeconds.toString(),
    });
  }
}

function parseMember(
  member: z.infer<typeof PatreonResponseData>,
  included: z.infer<typeof PatreonResponseIncluded>[],
) {
  function hasTier(id: string) {
    return member.relationships.currently_entitled_tiers.data.some(
      (entitledTier) => id === entitledTier.id,
    );
  }

  if (!config.patreon) {
    // should never happen: runPatreonTask should not be called if config.patreon is null.
    throw new Error('An unexpected error occurred.');
  }

  const tier = config.patreon.tiers.find((rewardTier) => hasTier(rewardTier.id));

  if (!tier) {
    // The user is probably subscribed to the "free tier"
    return null;
  }

  if (member.attributes.last_charge_status !== 'Paid' || !member.attributes.last_charge_date) {
    // Ignore if not paid.
    return null;
  }
  const lastCharged = new Date(member.attributes.last_charge_date);

  // Set dates
  const untilDate = new Date(lastCharged);
  untilDate.setDate(untilDate.getDate() + 34);

  const includedUser = included.find(
    (inc) => inc.type === 'user' && inc.id === member.relationships.user.data.id,
  );

  const discordId = includedUser?.attributes.social_connections?.discord?.user_id;
  if (!discordId) {
    // Ignore if no Discord account is linked to their Patreon.
    return null;
  }

  return {
    patreonUserId: member.id,
    discordUserId: discordId,
    tier: tier.tier,
    lastCharge: lastCharged,
    until: untilDate,
  };
}

export const PatreonResponseData = z.object({
  id: z.string(),
  type: z.literal('member'),
  attributes: z.object({
    full_name: z.string(),
    last_charge_date: z.string().nullable(),
    last_charge_status: z
      .enum(['Paid', 'Declined', 'Deleted', 'Pending', 'Refunded', 'Fraud', 'Other'])
      .nullable(),
  }),
  relationships: z.object({
    currently_entitled_tiers: z.object({
      data: z.array(z.object({ id: z.string(), type: z.literal('tier') })),
    }),
    user: z.object({
      data: z.object({ id: z.string(), type: z.literal('user') }),
      links: z.object({ related: z.string() }),
    }),
  }),
});

export const PatreonResponseIncluded = z.object({
  id: z.string(),
  type: z.string(), // typically `user`
  attributes: z.object({
    social_connections: z
      .object({
        // more connections may exist, including `facebook`, `google`, `spotify`, etc.
        discord: z
          .object({
            user_id: z.string(),
            scopes: z.array(z.string()).optional(),
            url: z.string().optional(),
          })
          .nullable(),
      })
      .optional(),
  }),
});

export const PatreonResponse = z.object({
  data: z.array(PatreonResponseData),
  included: z.array(PatreonResponseIncluded),
  links: z.object({ next: z.url() }).optional(),
  meta: z.object({
    pagination: z.object({
      cursors: z.object({ next: z.string().nullable() }),
      total: z.int(),
    }),
  }),
});

interface PremiumData {
  patreonUserId: string;
  discordUserId: string;
  tier: number;
  lastCharge: Date;
  until: Date;
}
