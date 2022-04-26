/* eslint-disable max-len */
/* eslint-disable no-inline-comments */
const fct = require('../../util/fct.js');
const cooldownUtil = require('./cooldownUtil.js');
const userModel = require('../models/userModel.js');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const { stripIndent } = require('common-tags');
const { supportServerInviteLink, botInviteLink, botInviteLinkAdmin } = require('../../const/config.js');


let handleLegacyCdGuild, handleLegacyCdUser;
if (process.env.NODE_ENV == 'production') {
  handleLegacyCdGuild = 5400 * 0.4;
  handleLegacyCdUser = 5400 * 6;
} else {
  handleLegacyCdGuild = 3600 * 0.4; // 20
  handleLegacyCdUser = 3600 * 6; // 60
}

module.exports.handleLegacy = async (msg) => {
  try {
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
  } catch (e) { reject(e); }
};

const sendLegacyWarningEmbed = function(msg) {
  const e = new MessageEmbed()
    .setAuthor({ name: 'WARNING', iconURL: 'https://cdn.pixabay.com/photo/2017/03/08/14/20/flat-2126885_1280.png' })
    .setDescription(stripIndent`On <t:1651734000>, <t:1651734000:R>, we will be ending support for commands written with a prefix.
            This is not our decision; Discord has mandated this action.
            If you do not already see slash commands when typing \`/\`, please ask an administrator to [click here to **reinvite the bot.**](${botInviteLink}) ***All of your statistics will be saved.***
            [Join our support server](${supportServerInviteLink}) if you have any questions.`)
    .setColor('#ffcc00');
  msg.channel.send({ embeds: [e] });
};

module.exports.handleDeprecation = async function(msg, chance) {
  try {
    msg.channel.send({
      embeds: [{
        title: '<:Slash:965409654148583494> Please Use Slash Commands',
        description: stripIndent`
          Legacy, or prefixed, commands are now **deprecated**. They may become unusable __without warning__.

          If you do not already see slash commands when typing \`/\`, please ask an administrator to [click here to **reinvite the bot.**](${botInviteLink}) ***All of your statistics will be saved.***

          [Join our support server](${supportServerInviteLink}) if you have any questions.`,
        author: {
          name: 'WARNING',
          icon_url: 'attachment://danger.png',
        },
        color: 16738560,
        thumbnail: { url: 'attachment://danger.png' },
        footer: { text: `This message currently has a ${(chance * 100).toFixed(1)}% chance of appearing and cancelling your command.` },
      }],
      files: ['./bot/temp/const/img/danger.png'],
      content: msg.author.toString(),
      components: [
        new MessageActionRow().addComponents(
          new MessageButton().setStyle('LINK').setLabel('Reinvite the bot')
            .setURL(botInviteLink),
          new MessageButton().setStyle('LINK').setLabel('Support Server')
            .setURL(supportServerInviteLink),
        ),
        new MessageActionRow().addComponents(
          new MessageButton().setStyle('LINK').setLabel('[Optional] Reinvite the bot with admin privileges')
            .setURL(botInviteLinkAdmin),
        ),
      ],
    });
    console.log(`Sent Deprecation Command Warning in ${msg.guild.name}.`);
  } catch (e) { reject(e); }
};

module.exports.legacySupportExpired = async function(msg) {
  try {
    msg.channel.send({
      embeds: [{
        title: '<:Slash:965409654148583494> Use Slash Commands.',
        description: stripIndent`
          Legacy, or prefixed, commands are now **removed**. Whenever you try to use them, you will encounter this message.

          If you do not already see slash commands when typing \`/\`, please ask an administrator to [click here to **reinvite the bot.**](${botInviteLink}) ***All of your statistics will be saved.***

          [Join our support server](${supportServerInviteLink}) if you have any questions.`,
        author: {
          name: 'WARNING',
          icon_url: 'attachment://cancel.png',
        },
        color: 16711680,
        thumbnail: { url: 'attachment://cancel.png' },
      }],
      files: ['./bot/temp/const/img/cancel.png'],
      content: msg.author.toString(),
      components: [
        new MessageActionRow().addComponents(
          new MessageButton().setStyle('LINK').setLabel('Reinvite the bot')
            .setURL(botInviteLink),
          new MessageButton().setStyle('LINK').setLabel('Support Server')
            .setURL(supportServerInviteLink),
        ),
        new MessageActionRow().addComponents(
          new MessageButton().setStyle('LINK').setLabel('[Optional] Reinvite the bot with admin privileges')
            .setURL(botInviteLinkAdmin),
        ),
      ],
    });
  } catch (e) { reject(e); }
};
