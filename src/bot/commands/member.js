const reset = require('./member/reset.js');
const stats = require('./member/stats.js');
const set = require('./member/set.js');
const giveTake = require('./member/giveTake.js');
const up = require('./member/up.js');
const info = require('./member/info.js');
const top = require('./member/top.js');
const errorMsgs = require('../../const/errorMsgs.js');
const fct = require('../../util/fct.js');

module.exports = (msg,args) => {
  return new Promise(async function (resolve, reject) {
    try {
      if (args.length < 1) {
        await msg.channel.send(errorMsgs.tooFewArguments.replace('<prefix>',msg.guild.appData.prefix));
        return resolve();
      }

      let userName = [],subcommand,tmp;

      for (i = 0; i < args.length; i++) {
        tmp = args[i].toLowerCase();
        if (tmp == 'stats' || tmp == 'give' || tmp == 'take' || tmp == 'up' || tmp == 'down' || tmp == 'set' || tmp == 'reset' || tmp == 'info' || tmp == 'top') {
          subcommand = tmp;
          break;
        }

        userName.push(args[i]);
      }

      if (!subcommand) {
        await msg.channel.send(errorMsgs.invalidSubcommand.replace('<prefix>',msg.guild.appData.prefix));
        return resolve();
      }

      userName = userName.join(' ');

      let targetUserId, member;

      if (!isNaN(userName) && userName < fct.maxBigInt && userName > fct.minIdInt) {
        targetUserId = userName;
      } else if (msg.mentions.members.first())
        targetUserId = msg.mentions.members.first().id;
      else if (userName != '') {
        member = msg.guild.members.cache.find(mem => (mem.user.username + '#' + mem.user.discriminator) == userName);
        if (!member) {
          const fetchedMembers = await msg.guild.members.fetch({query:`${userName}`,withPresences:false}); // # discordapi
          if (fetchedMembers.size)
            member = fetchedMembers.first();
        }

        if (!member) {
          await msg.channel.send(errorMsgs.memberNotFound.replace('<prefix>',msg.guild.appData.prefix));
          return resolve();
        } else
          targetUserId = member.id;
      }

      args = args.slice(i+1,args.length+1);

      subcommand = subcommand.toLowerCase();
      if (subcommand == 'stats')
        await stats(msg,targetUserId,args);
      else if (subcommand == 'give' || subcommand == 'take')
        await giveTake(msg,subcommand,targetUserId,args);
      else if (subcommand == 'up')
        await up(msg,targetUserId,args);
      else if (subcommand == 'top')
        await top(msg,targetUserId,args);
      else if (subcommand == 'info')
        await info(msg,targetUserId,args);
      else if (subcommand == 'set')
        await set(msg,targetUserId,args);
      else if (subcommand == 'reset')
        await reset(msg,targetUserId,args);
      else {
        await msg.channel.send(errorMsgs.invalidSubcommand.replace('<prefix>',msg.guild.appData.prefix));
        return resolve();
      }
    } catch (e) { reject(e); }
    resolve();
  });
}
