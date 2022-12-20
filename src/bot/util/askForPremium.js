const userModel = require("../models/userModel.js");
const fct = require("../../util/fct.js");
const cooldownUtil = require("./cooldownUtil.js");
const { EmbedBuilder } = require("discord.js");
const { oneLine } = require("common-tags");

let askForPremiumCdGuild, askForPremiumCdUser;
if (process.env.NODE_ENV == "production") {
  askForPremiumCdGuild = 3600 * 0.4;
  askForPremiumCdUser = 3600 * 6;
} else {
  askForPremiumCdGuild = 3600 * 0.4; // 20
  askForPremiumCdUser = 3600 * 6; // 60
}

module.exports = async function (interaction) {
  if (
    cooldownUtil.getCachedCooldown(
      interaction.guild.appData,
      "lastAskForPremiumDate",
      askForPremiumCdGuild
    ) > 0
  )
    return;

  if (fct.isPremiumGuild(interaction.guild)) return;

  await userModel.cache.load(interaction.user);
  const myUser = await userModel.storage.get(interaction.user);

  const now = Date.now() / 1000;
  if (now - myUser.lastAskForPremiumDate < askForPremiumCdUser) return;

  await userModel.storage.set(interaction.user, "lastAskForPremiumDate", now);
  interaction.guild.appData.lastAskForPremiumDate = now;

  await sendAskForPremiumEmbed(interaction);
  console.log(`Sent askForPremium in ${interaction.guild.name}.`);
};

async function sendAskForPremiumEmbed(interaction) {
  const e = new EmbedBuilder()
    .setTitle("Thank you for using ActivityRank!")
    .setColor(0x00ae86)
    .setThumbnail(interaction.client.user.displayAvatarURL());

  e.addFields({
    name: "The maintenance and development of this bot depend on your support!",
    value: oneLine`${interaction.user}, please consider helping this server to go Premium. 
      All features of the bot are free, but Premium servers receive additional (current and upcoming) 
      quality of life enhancements (significantly shorter stats cooldown, premium support, etc.). 
      Simply go to https://activityrank.me/premium to buy a few tokens for your user account or get some 
      **TOKENS FOR FREE** by regularly upvoting the bot on https://top.gg/bot/534589798267224065. 
      These tokens can then be redeemed for premium time on any server. **Thank you!**`,
  });

  await interaction.followUp({ embeds: [e], ephemeral: true });
}
