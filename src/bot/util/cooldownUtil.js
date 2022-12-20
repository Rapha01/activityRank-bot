const fct = require('../../util/fct.js');
const { users } = require('../../const/privilegedUsers.js');

const premiumLowersCooldownMessage =
  'You can significantly lower this cooldown by using tokens to activate premium time for your server. You can find further info about it here: https://activityrank.me/premium. ';
const activeStatCommandCooldown = (cd, toWait) => {
  return 'You can use stat commands only once per ' + cd + ' seconds, please wait ' + Math.ceil(toWait) + ' more seconds. ';
};
const activeResetServerCommandCooldown = (cd, toWait) => {
  return 'You can start a server reset only once every ' + cd + ' seconds, please wait ' + Math.ceil(toWait) + ' more seconds.';
};

exports.getCachedCooldown = (cache, field, cd) => {
  const nowDate = new Date() / 1000;

  if (typeof cache[field] === 'undefined') cache[field] = 0;

  const remaining = cd - (nowDate - cache[field]);
  return remaining;
};

exports.checkStatCommandsCooldown = (interaction) => {
  return new Promise(async function(resolve, reject) {
    try {
      if (users.includes(interaction.user.id))
        return resolve(true);

      const isPremiumGuild = fct.isPremiumGuild(interaction.guild);
      const cd = isPremiumGuild ? 5 : 30;
      const premiumLowersCooldownString = isPremiumGuild ? '' : premiumLowersCooldownMessage;

      const toWait = exports.getCachedCooldown(interaction.member.appData, 'lastStatCmdDate', cd);
      if (toWait > 0) {
        if (interaction.deferred) {
          await interaction.editReply({
            content: activeStatCommandCooldown(cd, toWait) + premiumLowersCooldownString,
            ephemeral: true,
          });
        } else {
          await interaction.reply({
            content: activeStatCommandCooldown(cd, toWait) + premiumLowersCooldownString,
            ephemeral: true,
          });
        }
        return resolve(false);
      }

      interaction.member.appData.lastStatCmdDate = Date.now() / 1000;
      resolve(true);
    } catch (e) { reject(e); }
  });
};

exports.checkResetServerCommandCooldown = (msg) => {
  return new Promise(async function(resolve, reject) {
    try {
      const isPremiumGuild = fct.isPremiumGuild(msg.guild);
      const cd = isPremiumGuild ? 5 : 30;
      const premiumLowersCooldownString = isPremiumGuild ? '' : premiumLowersCooldownMessage;

      const toWait = exports.getCachedCooldown(msg.guild.appData, 'lastResetServer', cd);
      if (toWait > 0) {
        await msg.channel.send(activeResetServerCommandCooldown(cd, toWait) + premiumLowersCooldownString);
        return resolve(false);
      }

      msg.guild.appData.lastResetServer = Date.now() / 1000;
      resolve(true);
    } catch (e) { reject(e); }
  });
};
