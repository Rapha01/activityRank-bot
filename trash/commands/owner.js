const errorMsgs = require('../../const/errorMsgs.js');

module.exports = (msg,args) => {
  return new Promise(async function (resolve, reject) {
    try {
      if (msg.author.id != '370650814223482880') {
        await msg.channel.send('Only the owner of this bot can use this command.');
        return resolve();
      }

      if (args.length < 1) {
        await msg.channel.send(errorMsgs.tooFewArguments.replace('<prefix>',msg.guild.appData.prefix));
        return resolve();
      }

      const field = args[0];
      const value = args.slice(1,args.length+1).join(' ');

      if (field == 'footer')
        await footer(msg,field,value);
      else {
        await msg.channel.send(errorMsgs.invalidSubcommand.replace('<prefix>',msg.guild.appData.prefix));
        return resolve();
      }

      resolve();
    } catch (e) { reject(e); }
  });
}

function footer(msg,field,value) {
  return new Promise(async function (resolve, reject) {
    try {
      await backupApi.setSingle('gl_admin',{id:0},field,value)
      await msg.channel.send('Setting updated.');
      resolve();
    } catch (e) { reject(e); }
  });
}
