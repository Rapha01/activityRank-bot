const keys = require('../const/keys.js').get();
var url = require('url')
const axios = require('axios');
const userModel = require('../models/userModel.js');
const shardDb = require('../models/shardDb.js');
const fct = require('../util/fct.js');

exports.updatePatrons = async function() {
  console.log('Updating Patrons');

  let res;
  try {
    res = await axios.get(encodeURI('https://www.patreon.com/api/oauth2/v2/campaigns/2925711/members?include=user,currently_entitled_tiers,address&fields[member]=full_name,is_follower,last_charge_date,last_charge_status,lifetime_support_cents,currently_entitled_amount_cents,patron_status&fields[tier]=amount_cents,created_at,description,discord_role_ids,edited_at,patron_count,published,published_at,requires_shipping,title,url&fields[user]=social_connections'), { 
      headers: { 'Authorization': 'Bearer ' + keys.patreonAccessToken  }
    });
  } catch (error) {
    throw error.code;
  }


  /*
  * Parse Patreon API. Create activePledges array: Contains all currently active pledges with untilDate, tier and discord connection.
  */
  console.log(' -------------- Patreon result.data -------------- ');
  console.log(res.data);

  let activePledges = [];
  for (let member of res.data.data) {
    try {
      let newPledge = {};
      // Set patreonUserId
      
      newPledge.patreonUserId = member.relationships.user.data.id;

      // Set tier. Ignore if no currently entitled tier.
      if (member.attributes.currently_entitled_amount_cents == '149') {
        newPledge.tier = 1;
      } else if (member.attributes.currently_entitled_amount_cents == '349') {
        newPledge.tier = 2;
      } else if (member.attributes.currently_entitled_amount_cents == '1449') {
        newPledge.tier = 3;
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

      activePledges.push(newPledge);
    } catch (error) {
      console.log('Patreon Api parsing error for member '+ member.attributes.full_name + ': ' + error);
    }
  }

  console.log(' -------------- Patreon parsed activePledges -------------- ');
  console.log(activePledges);

  /*
  * Update DB. Use activePledges to update DB (if information of pledge and DB differ)
  */

  const usersWithActivePledge = await shardDb.queryAllHosts(`SELECT * FROM user WHERE patreonTier > 0 && patreonTierUntilDate > ${Date.now() / 1000}`);

  for (let pledge of activePledges) {
    let userWithActivePledge = usersWithActivePledge.find(u => u.userId == pledge.discordUserId);
    
    // Update DB only if new pledge (update different tier only if new untilDate surpasses old untilDate, to avoid manual grant overridings)
    if (!userWithActivePledge || pledge.untilDate > userWithActivePledge.patreonTierUntilDate) {
      console.log('UPDATE DB \n oldUser: ', userWithActivePledge || 'noActiveTier', '\n Pledge: ', pledge);
      await userModel.storage.set(pledge.discordUserId,'patreonTier', pledge.tier);
      await userModel.storage.set(pledge.discordUserId,'patreonTierUntilDate', pledge.untilDate);
    }
  }
}
  
