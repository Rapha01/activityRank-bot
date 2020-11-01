const guildMemberModel = require('../models/guild/guildMemberModel.js');

module.exports = (msg,args) => {
  return new Promise(async function (resolve, reject) {
    try {
      if (args.length < 2) {
        await msg.channel.send('Too few arguments. Type ar!help set for more information');
        return resolve();
      }

      let subcommand = args[0];
      let value = args[1];

      subcommand = subcommand.toLowerCase();
      if (subcommand == 'notifylevelupdm' || subcommand == 'notify')
        await notify(msg,subcommand,value);
      else {
        await msg.channel.send('Invalid argument. Type ar!help set for more information');
        return resolve();
      }
    } catch (e) { reject(e); }
    resolve();
  });
}

function notify(msg,field,value) {
  return new Promise(async function (resolve, reject) {
    try {
      if (value == 'on')
        value = 1;
      else if (value == 'off')
        value = 0;
      else {
        msg.channel.send('The value for the notifylevelupdm setting needs to be either ``on`` or ``off``.');
        return resolve();
      }

      await guildMemberModel.set(msg.guild.id,msg.author.id,'notifylevelupdm',value);
      if (value)
        msg.channel.send('Successfully changed setting. You will receive levelup messages per dm from me.');
      else
        msg.channel.send('Successfully changed setting. You will no longer receive levelup messages per dm from me.');
      resolve();
    } catch (e) { reject(e); }
  });
}
