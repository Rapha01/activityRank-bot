const guildModel = require('../models/guild/guildModel.js');
const fct = require('../../util/fct.js');
const cooldownUtil = require('./cooldownUtil.js');

let tokenBurnCd;
if (process.env.NODE_ENV == 'production') {
  tokenBurnCd = 3600 * 4;
} else {
  tokenBurnCd = 600;
}

module.exports = (guild) => {
  return new Promise(async function (resolve, reject) {
    try {
      if (cooldownUtil.getCachedCooldown(guild.appData,'lastTokenBurnDate',tokenBurnCd) > 0)
        return resolve();
      guild.appData.lastTokenBurnDate = Date.now() / 1000;

      const myGuild = await guildModel.storage.get(guild);
      let lastBurnTimeDifference = (Date.now() / 1000) - myGuild.lastTokenBurnDate;
      const tokensToBurn24h = fct.getTokensToBurn24h(guild.memberCount);

      if (lastBurnTimeDifference < tokenBurnCd)
        return resolve();

      await guildModel.storage.set(guild,'lastTokenBurnDate',Date.now() / 1000);

      if (myGuild.lastTokenBurnDate == 0)
        return resolve();

      if (myGuild.tokens < tokensToBurn24h)
        return resolve();

      if (lastBurnTimeDifference > 86400 * 30) // 1 month
        lastBurnTimeDifference = 86400 * 30;

      //console.log(myGuild.lastTokenBurnDate,myGuild.tokens,tokensToBurn24h);

      let tokensToBurnNow = Math.floor((lastBurnTimeDifference / 86400) * tokensToBurn24h);
      if (tokensToBurnNow > myGuild.tokens)
        tokensToBurnNow = myGuild.tokens;

      await guildModel.storage.increment(guild,'tokens',-tokensToBurnNow);
      await guildModel.storage.increment(guild,'tokensBurned',tokensToBurnNow);

      console.log('BURRN BABY BURRNNN ' + guild.name + ' (' + guild.memberCount + ' members) for ' + tokensToBurnNow + ' tokens after ' + (Math.floor((lastBurnTimeDifference / 60 / 60) * 10)/10) + 'h. 24h burn: ' + Math.floor(tokensToBurn24h) + '. Guild tokens left: ' + (myGuild.tokens - tokensToBurnNow) + '.');
      resolve();
    } catch (e) { reject(e); }
  });
}
