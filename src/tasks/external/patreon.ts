import { get as getKeys } from '~/const/keys';
import { queryAllHosts } from '~/models/shardDb';
import { setUser } from '~/models/userModel';
const keys = getKeys();

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

export default defineTask({
  meta: {
    name: 'external:patreon',
    description: 'Update Patreon information',
  },
  async run() {
    console.log('[task | patreon] Updating information');
    if (process.env.NODE_ENV !== 'production') return { result: 'Ignored' };

    let nextUrl = baseURL.href;
    const apiMemberData = [];

    try {
      while (nextUrl) {
        const res = await $fetch<any>(nextUrl, { headers });

        for (const member of res.data.data) {
          const includedData = res.data.included.find(
            (inc) =>
              inc.type == 'user' && inc.id == member.relationships.user.data.id
          );
          member.included = includedData;
        }

        apiMemberData.push(res.data.data);

        if (res.data.links && res.data.links.next)
          nextUrl = res.data.links.next;
        else nextUrl = null;
      }
    } catch (error) {
      if (error.code) throw error.code;
      else throw error;
    }

    /*
     * Parse Patreon API. Create entitledPledgesWithDiscord array: Contains all currently active pledges with untilDate, tier and discord connection.
     */

    let entitledPledgesWithDiscord = [];
    for (const member of apiMemberData) {
      try {
        let tier = null;

        // Set tier. Ignore if no currently entitled tier.
        const cents = parseInt(
          member.attributes.currently_entitled_amount_cents
        );
        if (cents >= 1449) {
          tier = 3;
        } else if (cents >= 349) {
          tier = 2;
        } else if (cents >= 149) {
          tier = 1;
        } else continue;

        // Ignore if not paid.
        if (member.attributes.last_charge_status != 'Paid') continue;

        // Set dates
        const untilDate = new Date(member.attributes.last_charge_date);
        untilDate.setDate(untilDate.getDate() + 34);

        // Assign DiscordUserId. Ignore if no Discord connected.
        if (
          !member.included ||
          !member.included.attributes.social_connections.discord
        )
          continue;

        const newPledge = {
          patreonUserId: member.relationships.user.data.id,
          tier,
          last_charge_date: new Date(member.attributes.last_charge_date),
          untilDate: untilDate.getTime() / 1000,
          discordUserId:
            member.included.attributes.social_connections.discord.user_id,
        };

        entitledPledgesWithDiscord.push(newPledge);
      } catch (error) {
        console.log(
          `Patreon Api parsing error for member ${member.attributes.full_name}: ` +
            error
        );
      }
    }

    /*
     * Update DB. Use activePledges to update DB (if information of pledge and DB differ)
     */

    const usersWithActivePledge = await queryAllHosts(
      `SELECT * FROM user WHERE patreonTier > 0 && patreonTierUntilDate > ${
        Date.now() / 1000
      }`
    );

    for (const pledge of entitledPledgesWithDiscord) {
      let userWithActivePledge = usersWithActivePledge.find(
        (u) => u.userId == pledge.discordUserId
      );

      // Update DB only if new pledge (update different tier only if new untilDate surpasses old untilDate, to avoid manual grant overridings)
      if (
        !userWithActivePledge ||
        pledge.untilDate > userWithActivePledge.patreonTierUntilDate
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
          pledge.untilDate
        );
      }
    }
    return { result: 'Success' };
  },
});
