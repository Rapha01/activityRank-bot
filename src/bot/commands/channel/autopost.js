const errorMsgs = require('../../../const/errorMsgs.js');
const guildModel = require('../../models/guild/guildModel.js');

module.exports = (msg,targetChannelId,args) => {
  return new Promise(async function (resolve, reject) {
    try {
      if (!msg.member.permissionsIn(msg.channel).has("MANAGE_GUILD")) {
        await msg.channel.send('You need the permission to manage the server, in order to use this command.');
        return resolve();
      }
      if (!msg.guild.me.hasPermission('MANAGE_CHANNELS')) {
        await msg.channel.send('The bot has no permission to manage channels. Please kick and reinvite it with the new invitelink found on discordbots.org. Your servers stats will ***not*** reset.');
        return resolve();
      }
      if (args.length < 1) {
        await msg.channel.send(errorMsgs.tooFewArguments.replace('<prefix>',msg.guild.appData.prefix));
        return resolve();
      }

      if (!targetChannelId)
        targetChannelId = msg.channel.id;

      let field = args[0].toLowerCase();
      //const value = args.slice(1,args.length+1).join(' ');

      if (field == 'serverjoin')
        await serverjoin(msg,targetChannelId);
      else if (field == 'levelup')
        await levelup(msg,targetChannelId);
      else {
        await msg.channel.send(errorMsgs.invalidArgument.replace('<prefix>',msg.guild.appData.prefix));
        return resolve();
      }
    } catch (e) { reject(e); }
    resolve();
  });
}

function levelup(msg,targetChannelId) {
  return new Promise(async function (resolve, reject) {
    try {
      if (msg.guild.appData.autopost_levelup == targetChannelId || targetChannelId == 0) {
        await guildModel.storage.set(msg.guild,'autopost_levelup',0);
        await msg.channel.send('Removed autopost levelup channel.');
      } else {
        await guildModel.storage.set(msg.guild,'autopost_levelup',targetChannelId);
        await msg.channel.send('Levelup messages will now be sent to the specified channel.');
      }

      resolve();
    } catch (e) { reject(e); }
  });
}

function serverjoin(msg,targetChannelId) {
  return new Promise(async function (resolve, reject) {
    try {
      if (msg.guild.appData.autopost_serverJoin == targetChannelId || targetChannelId == 0) {
        await guildModel.storage.set(msg.guild,'autopost_serverJoin',0);
        await msg.channel.send('Removed autopost serverjoin channel.');
      } else {
        await guildModel.storage.set(msg.guild,'autopost_serverJoin',targetChannelId);
        await msg.channel.send('Serverjoin messages will now be sent to the specified channel.');
      }

      resolve();
    } catch (e) { reject(e); }
  });
}
