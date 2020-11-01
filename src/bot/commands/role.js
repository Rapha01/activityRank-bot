const set = require('./role/set.js');
const errorMsgs = require('../../const/errorMsgs.js');
const fct = require('../../util/fct.js');

module.exports = (msg,args) => {
  return new Promise(async function (resolve, reject) {
    try {
      if (args.length < 2) {
        await msg.channel.send(errorMsgs.tooFewArguments.replace('<prefix>',msg.guild.appData.prefix));
        return resolve();
      }

      let roleName = [],targetRoleId,targetRole,subcommand,i,tmp;


      for (i = 0; i < args.length; i++) {
        tmp = args[i].toLowerCase();
        if (tmp == 'set') {
          subcommand = tmp;
          break;
        }

        roleName.push(args[i]);
      }

      if (!subcommand) {
        await msg.channel.send(errorMsgs.invalidSubcommand.replace('<prefix>',msg.guild.appData.prefix));
        return resolve();
      }

      roleName = roleName.join(' ');

      if (!isNaN(roleName) && roleName < fct.maxBigInt && roleName > fct.minIdInt) {
        targetRoleId = roleName;
      } else if (msg.mentions.roles.first()) {
        targetRoleId = msg.mentions.roles.first().id;
      } else if (roleName != '') {
        targetRole = msg.guild.roles.cache.find(role => role.name == roleName);
        if (!targetRole) {
          await msg.channel.send('Role not found.');
          return resolve();
        } else
          targetRoleId = targetRole.id;
      }


      args = args.slice(i+1,args.length+1);

      subcommand = subcommand.toLowerCase();
      if (subcommand == 'set')
        await set(msg,targetRoleId,args);
      else {
        await msg.channel.send(errorMsgs.invalidSubcommand.replace('<prefix>',msg.guild.appData.prefix));
        return resolve();
      }
    } catch (e) { reject(e); }
    resolve();
  });
}
