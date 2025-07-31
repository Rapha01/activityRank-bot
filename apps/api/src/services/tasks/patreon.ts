import { keys } from '#const/config.js';
import { shards } from '#models/shard.js';
import { updateUser } from '#models/user.js';
import { backOff } from 'exponential-backoff';
import z from 'zod';

const baseURL = new URL('https://www.patreon.com/api/oauth2/v2/campaigns/2925711/members');
baseURL.searchParams.set('include', 'user,currently_entitled_tiers');
baseURL.searchParams.set(
  'fields[member]',
  'full_name,last_charge_date,last_charge_status,currently_entitled_amount_cents',
);
baseURL.searchParams.set('fields[tier]', 'amount_cents,created_at,url');
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
  const apiMembers: ParsedMember[] = [];

  while (true) {
    const res = await backOff(
      async () => {
        const fetched = await fetch(nextUrl, { headers });
        const json = await fetched.json();
        if (!fetched.ok) {
          throw new FetchError(
            `Failed to fetch Patreon URL (${fetched.status} ${fetched.statusText}) "${nextUrl}"`,
            fetched.status,
            fetched,
          );
        }
        return json;
      },
      // Only retry on FetchError and a non-4xx error code
      { retry: (e) => e instanceof FetchError && (e.code < 400 || e.code >= 500) },
    );
    const response = PatreonResponse.parse(res);

    apiMembers.push(...getParsedMembers(response));

    // sleep to try to avoid 429 errors
    await new Promise((r) => setTimeout(r, 1000));

    if (response.links?.next) {
      nextUrl = response.links.next;
    } else {
      break;
    }
  }

  /** Contains all currently active pledges with untilDate, tier and discord connection. */
  const entitledPledges: DiscordPledge[] = apiMembers
    .map((member) => getEntitledMemberPledge(member))
    .filter((p) => p !== null);

  // Update DB. Use entitledPledges to update DB (if information of pledge and DB differ)
  const usersWithActivePledge = await shards.executeOnAllHosts((db) =>
    db
      .selectFrom('user')
      .selectAll()
      .where('patreonTier', '>', 0)
      .where('patreonTierUntilDate', '>', Math.floor(Date.now() / 1000).toString())
      .execute(),
  );

  console.log(`Processing ${entitledPledges.length} pledges.`);

  // for each Patreon pledge, find the relevant db user.
  for (const pledge of entitledPledges) {
    const dbUser = usersWithActivePledge.find((u) => u.userId === pledge.discordUserId);

    const pledgeSeconds = pledge.until.getTime() / 1000;

    // If the user does not exist yet in the database, or if the pledge time
    // given by Patreon is greater than the current pledge time, update the user.
    // If the pledge given by Patreon is less useful, do _not_ update, to avoid
    // disrupting grants that may have been given manually in the database.
    if (dbUser && pledgeSeconds < Number.parseInt(dbUser.patreonTierUntilDate)) {
      continue;
    }

    await updateUser(pledge.discordUserId, {
      patreonTier: pledge.tier,
      patreonTierUntilDate: pledgeSeconds.toString(),
    });
  }
}

/** A Member object and their linked social connections */
type ParsedMember = z.infer<typeof PatreonResponseData> & {
  included?: z.infer<typeof PatreonResponseIncluded>;
};

function getParsedMembers(response: z.infer<typeof PatreonResponse>): ParsedMember[] {
  return response.data.map((member) => {
    const included = response.included.find(
      (inc) => inc.type === 'user' && inc.id === member.relationships.user.data.id,
    );
    return { ...member, included };
  });
}

function getMemberTier(member: ParsedMember) {
  const cents = member.attributes.currently_entitled_amount_cents;
  if (cents >= 1449) {
    return 3;
  }
  if (cents >= 349) {
    return 2;
  }
  if (cents >= 149) {
    return 1;
  }
  return null;
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
    discordUserId: member.included.attributes.social_connections.discord.user_id,
    tier,
    lastCharge: new Date(member.attributes.last_charge_date),
    until: untilDate,
  };
}

export const PatreonResponseData = z.object({
  id: z.string(),
  type: z.literal('member'),
  attributes: z.object({
    currently_entitled_amount_cents: z.number(),
    full_name: z.string(),
    last_charge_date: z.string().nullable(),
    last_charge_status: z
      .enum(['Paid', 'Declined', 'Deleted', 'Pending', 'Refunded', 'Fraud', 'Other'])
      .nullable(),
  }),
  relationships: z.object({
    currently_entitled_tiers: z.object({
      data: z.array(
        z.object({
          id: z.string(),
          type: z.literal('tier'), //?
        }),
      ),
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

interface DiscordPledge {
  patreonUserId: string;
  discordUserId: string;
  tier: number;
  lastCharge: Date;
  until: Date;
}
