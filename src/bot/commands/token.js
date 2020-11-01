const get = require('./token/get.js');
const redeem = require('./token/redeem.js');
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

      if (subcommand == 'get')
        await get(msg,args);
      else if (subcommand == 'redeem')
        await redeem(msg,args);
      else {
        await msg.channel.send(errorMsgs.invalidSubcommand.replace('<prefix>',msg.guild.appData.prefix));
        return resolve();
      }
      resolve();
    } catch (e) { reject(e); }
  });
}
