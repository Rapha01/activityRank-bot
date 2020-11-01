const set = require('./server/set.js');
const reset = require('./server/reset.js');
const stats = require('./server/stats.js');
const top = require('./server/top.js');
const errorMsgs = require('../../const/errorMsgs.js');

module.exports = (msg,args) => {
  return new Promise(async function (resolve, reject) {
    try {
      if (args.length < 1) {
        await msg.channel.send(errorMsgs.tooFewArguments.replace('<prefix>',msg.guild.appData.prefix));
        return resolve();
      }

      let subcommand = args[0].toLowerCase();
      args = args.slice(1,args.length+1);

      if (subcommand == 'set')
        await set(msg,args);
      else if (subcommand == 'stats')
        await stats(msg,args);
      else if (subcommand == 'top')
        await top(msg,args);
      else if (subcommand == 'reset')
        await reset(msg,args);
      else {
        await msg.channel.send(errorMsgs.invalidSubcommand.replace('<prefix>',msg.guild.appData.prefix));
        return resolve();
      }
    } catch (e) { reject(e); }
    resolve();
  });
}
