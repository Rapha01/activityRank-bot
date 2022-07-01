const guildModel = require('../models/guild/guildModel.js');
const guildChannelModel = require('../models/guild/guildChannelModel.js');
const guildRoleModel = require('../models/guild/guildRoleModel.js');
const guildMemberModel = require('../models/guild/guildMemberModel.js');
const statFlushCache = require('../statFlushCache.js');
const fct = require('../../util/fct.js');
const skip = require('../skip.js');
const { MessageEmbed } = require('discord.js')
const { legacySupportExpired } = require('../util/handleLegacy');

const acceptedChannelTypes = [
    'GUILD_TEXT',
    'GUILD_NEWS',
    'GUILD_PUBLIC_THREAD',
];
const acceptedMessageTypes = [
  'DEFAULT',
  'REPLY',
];

module.exports = {
	name: 'messageCreate',
	async execute(msg) {
      if (msg.author.bot == true || msg.system == true || skip(msg.guildId) || !acceptedMessageTypes.includes(msg.type))
          return;

      if (!msg.guild) {
          await msg.reply({ content:('Hi. Please use your commands inside the channel of a server i am in.\n Thanks!'), ephemeral: true });
          return;
      }

      await guildModel.cache.load(msg.guild);

      const mentionRegex = new RegExp(`^(<@!?${msg.client.user.id}>)\\s*test\\s*$`);
      if (mentionRegex.test(msg.content))
        await msg.reply('This test is successful. The bot is up and running.');


    if (msg.content.startsWith(msg.guild.appData.prefix))
      return await legacySupportExpired(msg);

    if (msg.guild.appData.textXp && acceptedChannelTypes.includes(msg.channel.type)) { await rankMessage(msg); }
	},
};


async function rankMessage(msg) {
      if (!msg.channel)
        return;
        
      let channel = msg.channel;
      if (msg.channel.type ==  'GUILD_PUBLIC_THREAD')
        channel = msg.channel.parent;

      await msg.guild.members.fetch(msg.author.id);

      if (!msg.member)
        return;

      await guildMemberModel.cache.load(msg.member);
      msg.member.appData.lastMessageChannelId = msg.channel.id;

      // Check noxp channel & allowInvisibleXp
      await guildChannelModel.cache.load(channel);

      if (channel.appData.noXp)
        return;

      // Check noxp role
      for (let role of msg.member.roles.cache) {
        role = role[1];
        await guildRoleModel.cache.load(role);

        if (role.appData.noXp)
          return;
      }

      // Check textmessage cooldown
      const nowSec = Date.now() / 1000;

      if (typeof msg.guild.appData.textMessageCooldownSeconds !== 'undefined') {
        if (nowSec - msg.member.appData.lastTextMessageDate < msg.guild.appData.textMessageCooldownSeconds)
          return;
        msg.member.appData.lastTextMessageDate = nowSec;
      }

      // Add Score
      await statFlushCache.addTextMessage(msg.member,channel,1);

      return;

}
