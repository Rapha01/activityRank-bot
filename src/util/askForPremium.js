const userModel = require('../bot/models/userModel.js');
const fct = require('./fct.js');
const Discord = require('discord.js');

let askForPremiumCd;
if (process.env.NODE_ENV == 'production') {
  askForPremiumCdGuild = 3600 * 0.5;
  askForPremiumCdUser = 3600 * 24;
} else {
  askForPremiumCdGuild = 20;
  askForPremiumCdUser = 60;
}

module.exports = (msg) => {
  return new Promise(async function (resolve, reject) {
    try {
      if (fct.getGuildActionCooldown(msg.guild,'lastAskForPremiumDate',askForPremiumCdGuild) > 0)
        return resolve();

      if (fct.isPremiumGuild(msg.guild))
        return resolve();

      await userModel.cache.load(msg.member.user);
      const myUser = await userModel.storage.get(msg.member.user);

      const now = Date.now() / 1000;
      if (now - myUser.lastAskForPremiumDate < askForPremiumCdUser)
        return resolve();

      await userModel.storage.set(msg.member.user,'lastAskForPremiumDate', now);
      msg.guild.appData.lastAskForPremiumDate = now;

      await fct.sleep(2000);
      await sendAskForPremiumEmbed(msg);

      console.log('Sent askForPremium in ' + msg.guild.name + '.');
    } catch (e) { reject(e); }
    resolve();
  });
}

const sendAskForPremiumEmbed = (msg) => {
  return new Promise(async function (resolve, reject) {
    try {
      const embed = new Discord.MessageEmbed()
          .setTitle(`Thank you for using ActivityRank!`)
          .setColor('#4fd6c8')
          .setThumbnail(msg.client.user.displayAvatarURL());

      embed.addField(`The maintenance and development of this bot depend on your support!`, `<@${msg.member.id}> Please consider helping this server to go Premium. All features of the bot are free, but Premium servers receive additional (current and upcoming) quality of life enhancements (significantly shorter stats cooldown, premium support, etc.). Simply go to https://activityrank.me/premium to load a few tokens on your user account. These tokens can then be redeemed for premium time on any server. Thank you!`);

      await msg.channel.send(embed);

    } catch (e) { reject(e); }
    resolve();
  });
}
