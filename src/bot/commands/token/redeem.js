const errorMsgs = require('../../../const/errorMsgs.js');
const userModel = require('../../models/userModel.js');
const guildModel = require('../../models/guild/guildModel.js');
const guildMemberModel = require('../../models/guild/guildMemberModel.js');

module.exports = (msg,args) => {
  return new Promise(async function (resolve, reject) {
    try {
      if (args.length < 1) {
        await msg.channel.send(errorMsgs.tooFewArguments.replace('<prefix>',msg.guild.appData.prefix));
        return resolve();
      }

      await userModel.cache.load(msg.member.user);
      const myUser = await userModel.storage.get(msg.member.user);

      let field = args[0].toLowerCase();
      const value = args.slice(1,args.length+1).join(' ');

      if (field == 'votepower')
        await votepower(msg,myUser,value);
      else if (field == 'premiumserver')
        await serverpower(msg,myUser,value);
      else {
        await msg.channel.send(errorMsgs.invalidArgument.replace('<prefix>',msg.guild.appData.prefix));
        return resolve();
      }
    } catch (e) { reject(e); }
    resolve();
  });
}

const plans =  {
  2: 10,
  /*3: 100,
  4: 1000,
  5: 10000*/
};

function serverpower(msg,myUser,value) {
  return new Promise(async function (resolve, reject) {
    try {
      const nowDate = new Date() / 1000;

      if (!value || isNaN(value) || value < 1 || value > 1000000) {
        await msg.channel.send('Value must be within 1 and 1000000.');
        return resolve();
      }

      if (myUser.tokens < value) {
        await msg.channel.send('You have less tokens than you want to add to this server. You have and can only add ' + myUser.tokens + ' tokens currently. Check out the ``' + msg.guild.appData.prefix + 'help token`` command for infos on how to get more tokens.');
        return resolve();
      }

      await userModel.storage.increment(msg.member.user,'tokens',-value);

      await guildMemberModel.storage.increment(msg.guild,msg.member.id,'tokensBurned',value);
      await guildModel.storage.increment(msg.guild,'tokens',value);

      await msg.channel.send('Successfully powered tokens into this servers bot. Thank you for supporting this server and the development of ActivityRank!');

      resolve();
    } catch (e) { reject(e); }
  });
}

function votepower(msg,myUser,value) {
  return new Promise(async function (resolve, reject) {
    try {
      const nowDate = new Date() / 1000;

      /*
      if (Object.keys(plans).indexOf(value) == -1) {
        await msg.channel.send('Value must be one of ' + Object.keys(plans).join(', ') + ' - depending on the plan you want to activate.');
        return resolve();
      }*/
      value = 2;

      if (myUser.voteMultiplierUntil > nowDate) {
        await msg.channel.send('You already have an active votepower increase ( ' + myUser.voteMultiplier + 'x ). Please wait ' + Math.ceil((myUser.voteMultiplierUntil - nowDate) / 60 / 60) + ' more hours to redeem a new one. ');
        return resolve();
      }

      if (myUser.tokens < plans[value]) {
        await msg.channel.send('Not enough tokens for the ' + value + 'x xp. It costs ' + plans[value] + ' (for 72 hours) and you have only ' + myUser.tokens + '. Use ``' + msg.guild.appData.prefix + 'help tokens`` to find out how to get more.');
        return resolve();
      }

      await userModel.storage.increment(msg.member.user,'tokens',-plans[value]);
      await userModel.storage.set(msg.member.user,'voteMultiplierUntil',nowDate + 259200);
      await userModel.storage.set(msg.member.user,'voteMultiplier',value);



      await msg.channel.send('Successfully activated ' + value + 'x votePower for the next 72 hours.');

      resolve();
    } catch (e) { reject(e); }
  });
}
