const guildChannelModel = require('../../models/guild/guildChannelModel.js');
const guildModel = require('../../models/guild/guildModel.js');
const errorMsgs = require('../../../const/errorMsgs.js');

module.exports = (msg,targetChannelId,args) => {
  return new Promise(async function (resolve, reject) {
    try {
      if (!msg.member.permissionsIn(msg.channel).has("MANAGE_GUILD")) {
        await msg.channel.send('You need the permission to manage the server, in order to use this command.');
        return resolve();
      }
      if (args.length < 1) {
        await msg.channel.send(errorMsgs.tooFewArguments.replace('<prefix>',msg.guild.appData.prefix));
        return resolve();
      }

      let field = args[0].toLowerCase();
      const value = args.slice(1,args.length+1).join(' ');

      if (!targetChannelId)
        targetChannelId = msg.channel.id;

      if (field == 'noxp')
        await noXp(msg,targetChannelId);
      else if (field == 'nocommand')
        await noCommand(msg,targetChannelId);
      else if (field == 'commandonly' || field == 'commandsonly')
        await commandOnly(msg,targetChannelId);
      else {
        await msg.channel.send(errorMsgs.invalidArgument.replace('<prefix>',msg.guild.appData.prefix));
        return resolve();
      }
    } catch (e) { reject(e); }
    resolve();
  });
}

function noCommand(msg,targetChannelId) {
  return new Promise(async function (resolve, reject) {
    try {
      const myChannel = await guildChannelModel.storage.get(msg.guild,targetChannelId);

      if (myChannel.noCommand) {
        await guildChannelModel.storage.set(msg.guild,targetChannelId,'noCommand',0);
        await msg.channel.send('Specified channel now accepts commands.');
      } else {
        await guildChannelModel.storage.set(msg.guild,targetChannelId,'noCommand',1);
        await msg.channel.send('Specified channel no longer accepts commands.');
      }

      resolve();
    } catch (e) { reject(e); }
  });
}

function noXp(msg,targetChannelId) {
  return new Promise(async function (resolve, reject) {
    try {
      const myChannel = await guildChannelModel.storage.get(msg.guild,targetChannelId);

      if (myChannel.noXp) {
        await guildChannelModel.storage.set(msg.guild,targetChannelId,'noXp',0);
        await msg.channel.send('Specified channel now gives XP.');
      } else {
        await guildChannelModel.storage.set(msg.guild,targetChannelId,'noXp',1);
        await msg.channel.send('Specified channel no longer gives XP.');
      }

      resolve();
    } catch (e) { reject(e); }
  });
}

function commandOnly(msg,targetChannelId) {
  return new Promise(async function (resolve, reject) {
    try {
      if (msg.guild.appData.commandOnlyChannel == targetChannelId || targetChannelId == 0) {
        await guildModel.storage.set(msg.guild,'commandOnlyChannel',0);
        await msg.channel.send('Removed commandOnly channel. Commands are allowed globaly again.');
      } else {
        await guildModel.storage.set(msg.guild,'commandOnlyChannel',targetChannelId);
        await msg.channel.send('Commands are now allowed only in the specified channel.');
      }

      resolve();
    } catch (e) { reject(e); }
  });
}
