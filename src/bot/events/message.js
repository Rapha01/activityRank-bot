const guildModel = require('../models/guild/guildModel.js');
const handleCommand = require('./handleCommand.js');
const guildChannelModel = require('../models/guild/guildChannelModel.js');
const guildRoleModel = require('../models/guild/guildRoleModel.js');
const guildMemberModel = require('../models/guild/guildMemberModel.js');
const statFlushCache = require('../statFlushCache.js');
const fct = require('../../util/fct.js');
const skip = require('../skip.js');
const { MessageEmbed } = require('discord.js')
const checkBotPermissions = require('../util/checkBotPermissions.js');

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
	execute(msg) {
        return new Promise(async function (resolve,reject) {
            try {
                if (msg.author.bot == true || msg.system == true || skip(msg.guildId) || !acceptedMessageTypes.includes(msg.type))
                    return resolve();
              
                if (!msg.guild) {
                    await msg.reply({ content:('Hi. Please use your commands inside the channel of a server i am in.\n Thanks!'), ephemeral: true });
                    return resolve();
                } 
              
                await guildModel.cache.load(msg.guild);
              
                if (msg.mentions.members.first() && msg.mentions.members.first().id == msg.client.user.id) {
                    await msg.reply({content:'Hey, thanks for mentioning me! The prefix for the bot on this server is ``'+msg.guild.appData.prefix+'``. Type ``'+msg.guild.appData.prefix+'help`` for more information. Have fun!', ephemeral: true });
                    return resolve();
                } 
                
              if (msg.content.startsWith(msg.guild.appData.prefix)) {
                  await checkBotPermissions(msg);
                  await handleCommand(msg);
                  return resolve();
              }
              
              if (msg.guild.appData.textXp && acceptedChannelTypes.includes(msg.channel.type)) { await rankMessage(msg); }

              return resolve();

            } catch (e) { reject(e); }
        });
	},
};


function rankMessage(msg) {
  return new Promise(async function(resolve, reject) {
    try {
      let channel = msg.channel;
      if (msg.channel.type ==  'GUILD_PUBLIC_THREAD')
        channel = msg.channel.parent;
    
      await msg.guild.members.fetch(msg.author.id);

      if (!msg.member)
        return resolve();

      await guildMemberModel.cache.load(msg.member);
      msg.member.appData.lastMessageChannelId = msg.channel.id;

      // Check noxp channel & allowInvisibleXp
      await guildChannelModel.cache.load(channel);

      if (channel.appData.noXp)
        return resolve();

      // Check noxp role
      for (let role of msg.member.roles.cache) {
        role = role[1];
        await guildRoleModel.cache.load(role);

        if (role.appData.noXp)
          return resolve();
      }

      // Check textmessage cooldown
      const nowSec = Date.now() / 1000;

      if (typeof msg.guild.appData.textMessageCooldownSeconds !== 'undefined') {
        if (nowSec - msg.member.appData.lastTextMessageDate < msg.guild.appData.textMessageCooldownSeconds)
          return resolve();

        msg.member.appData.lastTextMessageDate = nowSec;
      }

      // Add Score
      await statFlushCache.addTextMessage(msg.member,channel,1);

      return resolve();
    } catch (e) { reject(e); }
  });
}

function hasCommandPrefix(str) {
  const prefixes = ['+','-','!','`','$','/',';','>','.'];
  for (prefix of prefixes) {
    if (str.indexOf(prefix) != -1)
      return true;
  }

  return false;
}
