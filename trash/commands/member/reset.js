const resetModel = require('../../models/resetModel.js');
const errorMsgs = require('../../../const/errorMsgs.js');

module.exports = (msg,targetUserId,args) => {
  return new Promise(async function (resolve, reject) {
    try {
      if (!targetUserId) {
        await msg.channel.send('Could not find member.');
        return resolve();
      }
      if (!msg.member.permissionsIn(msg.channel).has("MANAGE_GUILD")) {
        await msg.channel.send('You need the permission to manage the server, in order to use this command.');
        return resolve();
      }
      if (args.length < 1) {
        await msg.channel.send(errorMsgs.tooFewArguments.replace('<prefix>',msg.guild.appData.prefix));
        return resolve();
      }

      const field = args[0].toLowerCase();

      if (field == 'stats') {
        resetModel.resetJobs[msg.guild.id] = {type:'guildMembersStats',cmdChannel:msg.channel,userIds:[targetUserId]};
        await msg.channel.send('Resetting, please wait...');
      } else {
        await msg.channel.send(errorMsgs.invalidArgument.replace('<prefix>',msg.guild.appData.prefix));
        return resolve();
      }

      resolve();
    } catch (e) { reject(e); }
  });
}
