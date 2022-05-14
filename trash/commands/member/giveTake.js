const guildMemberModel = require('../../models/guild/guildMemberModel.js');
const statFlushCache = require('../../statFlushCache.js');
const errorMsgs = require('../../../const/errorMsgs.js');

module.exports = (msg,command,targetUserId,args) => {
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

      let value = args[0];
      if (isNaN(value) || value == 0 || value < 0)  {
        await msg.channel.send('Please use a positive number to specify how much XP should be added / removed.');
        return resolve();
      }
      if (value > 1000000)  {
        await msg.channel.send('You can give or take only at maximum 1.000.000 XP at a time.' );
        return resolve();
      }
      value = Math.round(value);

      if (command == 'take')
        value = (-1) * value;

      const targetMember = await msg.guild.members.fetch(targetUserId);
      if (!targetMember)  {
        await msg.channel.send('Could not find member.');
        return resolve();
      }
      await guildMemberModel.cache.load(targetMember);

      await statFlushCache.addBonus(targetMember,value);
      await msg.channel.send('Successfully changed bonus XP.' );

      resolve();
    } catch (e) { reject(e); }
  });
}
