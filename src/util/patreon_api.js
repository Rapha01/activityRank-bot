const keys = require('../const/keys.js').get();
var url = require('url')
const axios = require('axios');
const userModel = require('../models/userModel.js');
const shardDb = require('../models/shardDb.js');
const fct = require('../util/fct.js');

exports.updatePatrons = async function() {
  console.log('Updating Patrons');

  let res;
  let nextUrl = encodeURI('https://www.patreon.com/api/oauth2/v2/campaigns/2925711/members?include=user,currently_entitled_tiers,address&fields[member]=full_name,is_follower,last_charge_date,last_charge_status,lifetime_support_cents,currently_entitled_amount_cents,patron_status&fields[tier]=amount_cents,created_at,description,discord_role_ids,edited_at,patron_count,published,published_at,requires_shipping,title,url&fields[user]=social_connections');
  let apiMemberData = [];

  try {
    while (nextUrl) {
      res = await axios.get(nextUrl, { 
        headers: { 'Authorization': 'Bearer ' + keys.patreonAccessToken  }
      });
      
      apiMemberData = apiMemberData.concat(res.data.data);
      
      if (res.data.links && res.data.links.next)
        nextUrl = res.data.links.next;
      else
        nextUrl = null;
    }
  } catch (error) {
    if (error.code) throw error.code;
    else throw error;
  }

  /*
  * Parse Patreon API. Create entitledPledgesWithDiscord array: Contains all currently active pledges with untilDate, tier and discord connection.
  */

  let entitledPledgesWithDiscord = [];
  for (let member of apiMemberData) {
    try {
      let newPledge = {};

      // Set patreonUserId
      newPledge.patreonUserId = member.relationships.user.data.id;

      // Set tier. Ignore if no currently entitled tier.
      if (member.attributes.currently_entitled_amount_cents >= '1449') {
        newPledge.tier = 3;
      } else if (member.attributes.currently_entitled_amount_cents >= '349') {
        newPledge.tier = 2;
      } else if (member.attributes.currently_entitled_amount_cents >= '149') {
        newPledge.tier = 1;
      } else 
        continue;

      // Ignore if not paid.
      if (member.attributes.last_charge_status != 'Paid') 
        continue;
      
      // Set dates
      newPledge.last_charge_date = new Date(member.attributes.last_charge_date);
      newPledge.untilDate =  new Date(member.attributes.last_charge_date);
      newPledge.untilDate.setDate(newPledge.untilDate.getDate()+34);
      newPledge.untilDate = newPledge.untilDate.getTime() / 1000;

      // Assign DiscordUserId. Ignore if no Discord connected.
      let user = res.data.included.find(inc => inc.type == 'user' && inc.id == newPledge.patreonUserId);
      if (user && user.attributes.social_connections.discord)
        newPledge.discordUserId = user.attributes.social_connections.discord.user_id
      else 
        continue;
       
      entitledPledgesWithDiscord.push(newPledge);
    } catch (error) {
      console.log('Patreon Api parsing error for member '+ member.attributes.full_name + ': ' + error);
    }
  }

  /*
  * Update DB. Use activePledges to update DB (if information of pledge and DB differ)
  */

  const usersWithActivePledge = await shardDb.queryAllHosts(`SELECT * FROM user WHERE patreonTier > 0 && patreonTierUntilDate > ${Date.now() / 1000}`);

  for (let pledge of entitledPledgesWithDiscord) {
    let userWithActivePledge = usersWithActivePledge.find(u => u.userId == pledge.discordUserId);
    
    // Update DB only if new pledge (update different tier only if new untilDate surpasses old untilDate, to avoid manual grant overridings)
    if (!userWithActivePledge || pledge.untilDate > userWithActivePledge.patreonTierUntilDate) {
      console.log('UPDATE DB \n oldUser: ', userWithActivePledge || 'noActiveTier', '\n Pledge: ', pledge);
      await userModel.storage.set(pledge.discordUserId,'patreonTier', pledge.tier);
      await userModel.storage.set(pledge.discordUserId,'patreonTierUntilDate', pledge.untilDate);
    }
  }
}
  
