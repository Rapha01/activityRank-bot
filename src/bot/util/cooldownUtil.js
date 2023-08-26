import fct from '../../util/fct.js';
import { users } from '../../const/privilegedUsers.js';

const premiumLowersCooldownMessage =
  'You can significantly lower this cooldown by supporting the bot and choosing the proper patreon tier for your needs. You can find further info about it here: https://patreon.com/rapha01/. ';
const activeStatCommandCooldown = (cd, toWait) => {
  return (
    'You can use stat commands only once per ' +
    cd +
    ' seconds, please wait ' +
    Math.ceil(toWait) +
    ' more seconds. '
  );
};
const activeResetServerCommandCooldown = (cd, toWait) => {
  return (
    'You can start a server reset only once every ' +
    cd +
    ' seconds, please wait ' +
    Math.ceil(toWait) +
    ' more seconds.'
  );
};

export const getCachedCooldown = (cache, field, cd) => {
  const nowDate = new Date() / 1000;

  if (typeof cache[field] === 'undefined') cache[field] = 0;

  const remaining = cd - (nowDate - cache[field]);
  return remaining;
};

export const checkStatCommandsCooldown = (interaction) => {
  return new Promise(async function (resolve, reject) {
    try {
      if (users.includes(interaction.user.id)) return resolve(true);

      const { userTier, ownerTier } = await fct.getPatreonTiers(interaction);

      let cd = 300;
      if (userTier == 1) cd = 60;
      if (ownerTier == 3) cd = 30;
      if (userTier == 2 || userTier == 3) cd = 5;

      const premiumLowersCooldownString = userTier == 2 || userTier == 3
        ? ''
        : premiumLowersCooldownMessage;

      const toWait = getCachedCooldown(interaction.member.appData, 'lastStatCmdDate', cd);
      if (toWait > 0) {
        if (interaction.deferred) {
          await interaction.editReply({
            content:
              activeStatCommandCooldown(cd, toWait) +
              premiumLowersCooldownString,
            ephemeral: true,
          });
        } else {
          await interaction.reply({
            content:
              activeStatCommandCooldown(cd, toWait) +
              premiumLowersCooldownString,
            ephemeral: true,
          });
        }
        return resolve(false);
      }

      interaction.member.appData.lastStatCmdDate = Date.now() / 1000;
      resolve(true);
    } catch (e) {
      reject(e);
    }
  });
};

export const checkResetServerCommandCooldown = (interaction) => {
  return new Promise(async function (resolve, reject) {
    try {
      const { userTier, ownerTier } = await fct.getPatreonTiers(interaction);

      let cd = 300;
      if (userTier == 1) cd = 120;
      if (ownerTier == 3) cd = 60;
      if (userTier == 2 || userTier == 3) cd = 10;

      const premiumLowersCooldownString = userTier == 2 || userTier == 3
        ? ''
        : premiumLowersCooldownMessage;

      const toWait = getCachedCooldown(interaction.guild.appData, 'lastResetServer', cd);
      if (toWait > 0) {
        await interaction.channel.send(
          activeResetServerCommandCooldown(cd, toWait) +
            premiumLowersCooldownString
        );
        return resolve(false);
      }

      interaction.guild.appData.lastResetServer = Date.now() / 1000;
      resolve(true);
    } catch (e) {
      reject(e);
    }
  });
};
