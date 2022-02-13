const guildMemberModel = require('../../models/guild/guildMemberModel.js');
const guildRoleModel = require('../../models/guild/guildRoleModel.js');
const statFlushCache = require('../../statFlushCache.js');
const errorMsgs = require('../../../const/errorMsgs.js');

module.exports = (msg,command,targetRoleId,args) => {
  return new Promise(async function (resolve, reject) {
    try {

      if (!targetRoleId) {
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

      const targetRole = await msg.guild.roles.fetch(targetRoleId);
      if (!targetRole)  {
        await msg.channel.send('Could not find role.');
        return resolve();
      }

      await guildRoleModel.cache.load(targetRole);
      const members = msg.guild.roles.cache.get(targetRoleId).members; //.map(m=>m.user.id);
      console.log(members);

      for (let member of members) {
        member = member[1];
        await guildMemberModel.cache.load(member);
        await statFlushCache.addBonus(member,value);
      }

      await msg.channel.send('Successfully changed bonus XP.' );

      resolve();
    } catch (e) { reject(e); }
  });
}
