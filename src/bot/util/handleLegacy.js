/* eslint-disable max-len */
/* eslint-disable no-inline-comments */
const fct = require('../../util/fct.js');
const cooldownUtil = require('./cooldownUtil.js');
const userModel = require('../models/userModel.js');
const { MessageEmbed } = require('discord.js');
const { stripIndent } = require('common-tags');
const { botInviteLink } = require('../../const/config.js');


let handleLegacyCdGuild, handleLegacyCdUser;
if (process.env.NODE_ENV == 'production') {
  handleLegacyCdGuild = 5400 * 0.4;
  handleLegacyCdUser = 5400 * 6;
} else {
  handleLegacyCdGuild = 3600 * 0.4; // 20
  handleLegacyCdUser = 3600 * 6; // 60
}

module.exports = async (msg) => {
  await userModel.cache.load(msg.member.user);
  if (cooldownUtil.getCachedCooldown(msg.guild.appData, 'lastHandleLegacyDate', handleLegacyCdGuild) > 0)
    return;
  if (cooldownUtil.getCachedCooldown(msg.member.user.appData, 'lastHandleLegacyDate', handleLegacyCdUser) > 0)
    return;

  msg.guild.appData.lastHandleLegacyDate = Date.now() / 1000;
  msg.member.user.appData.lastHandleLegacyDate = Date.now() / 1000;

  await fct.sleep(2000);
  sendLegacyWarningEmbed(msg);

  console.log(`Sent Legacy Command Warning in ${msg.guild.name}.`);
};

const sendLegacyWarningEmbed = function(msg) {
  const e = new MessageEmbed()
    .setAuthor({ name: 'WARNING', iconURL: 'https://cdn.pixabay.com/photo/2017/03/08/14/20/flat-2126885_1280.png' })
    .setDescription(stripIndent`On <t:1649746800>, we will be ending support for commands written with a prefix.
            This is not our decision; Discord has mandated this action. 
            If you do not already see slash commands when typing \`/\`, please ask an administrator to [click here to **reinvite the bot.**](${botInviteLink}) ***All of your statistics will be saved.***
            [Join our support server](https://discordapp.com/invite/DE3eQ8H) if you have any questions.`)
    .setColor('#ffcc00');
  msg.channel.send({ embeds: [e] });
};