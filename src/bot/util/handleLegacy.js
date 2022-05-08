/* eslint-disable max-len */
const { MessageActionRow, MessageButton } = require('discord.js');
const { stripIndent } = require('common-tags');
const { supportServerInviteLink, botInviteLink, botInviteLinkAdmin } = require('../../const/config.js');

module.exports.legacySupportExpired = async function(msg) {
  return new Promise(async function (resolve, reject) {
    try {
      await msg.channel.send({
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
  });
};
