const fct = require('../../util/fct.js');
const errorMsgs = require('../../const/errorMsgs.js');

exports.getCachedCooldown = (cache,field,cd) => {
    const nowDate = new Date() / 1000;

    if (typeof cache[field] === 'undefined') cache[field] = 0;

    const remaining = cd - (nowDate - cache[field]);
    return remaining;
}

exports.checkStatCommandsCooldown = (msg) => {
  return new Promise(async function (resolve, reject) {
    try {
      const isPremiumGuild = fct.isPremiumGuild(msg.guild);
      const cd = isPremiumGuild ? 5 : 30;
      const premiumLowersCooldownString = isPremiumGuild ? '' : errorMsgs.premiumLowersCooldown;

      const toWait = exports.getCachedCooldown(msg.member.appData,'lastStatCmdDate',cd);
      if (toWait > 0) {
        await msg.channel.send(errorMsgs.activeStatCommandCooldown(cd,toWait) + premiumLowersCooldownString);
        return resolve(false);
      }

      msg.member.appData.lastStatCmdDate = Date.now() / 1000;
      resolve(true);
    } catch (e) { reject(e); }
  });
}

exports.checkResetServerCommandCooldown = (msg) => {
  return new Promise(async function (resolve, reject) {
    try {
      const isPremiumGuild = fct.isPremiumGuild(msg.guild);
      const cd = isPremiumGuild ? 5 : 30;
      const premiumLowersCooldownString = isPremiumGuild ? '' : errorMsgs.premiumLowersCooldown;

      const toWait = exports.getCachedCooldown(msg.guild.appData,'lastResetServer',cd);
      if (toWait > 0) {
        await msg.channel.send(errorMsgs.activeResetServerCommandCooldown(cd,toWait) + premiumLowersCooldownString);
        return resolve(false);
      }

      msg.guild.appData.lastResetServer = Date.now() / 1000;
      resolve(true);
    } catch (e) { reject(e); }
  });
}
