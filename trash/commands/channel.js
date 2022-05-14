const reset = require('./channel/reset.js');
const top = require('./channel/top.js');
const stats = require('./channel/stats.js');
const set = require('./channel/set.js');
const autopost = require('./channel/autopost.js');
const errorMsgs = require('../../const/errorMsgs.js');
const fct = require('../../util/fct.js');

module.exports = (msg,args) => {
  return new Promise(async function (resolve, reject) {
    try {
      if (args.length < 1) {
        await msg.channel.send(errorMsgs.tooFewArguments.replace('<prefix>',msg.guild.appData.prefix));
        return resolve();
      }

      let channelName = [],subcommand,channel,i,tmp;

      for (i = 0; i < args.length; i++) {
        tmp = args[i].toLowerCase();
        if (tmp == 'set' || tmp == 'stats' ||  tmp == 'autopost' || tmp == 'reset' || tmp == 'top') {
          subcommand = tmp;
          break;
        }

        channelName.push(args[i]);
      }

      if (!subcommand) {
        await msg.channel.send(errorMsgs.invalidSubcommand.replace('<prefix>',msg.guild.appData.prefix));
        return resolve();
      }

      channelName = channelName.join(' ');
      let targetChannelId,targetChannel;

      if (!isNaN(channelName) && channelName < fct.maxBigInt && channelName > fct.minIdInt) {
        targetChannelId = channelName;
      } else if (msg.mentions.channels.first()) {
        targetChannelId = msg.mentions.channels.first().id;
      } else if (channelName != '') {
        targetChannel = msg.guild.channels.cache.find(channel => channel.name == channelName);
        if (!targetChannel) {
          await msg.channel.send('Channel not found.');
          return resolve();
        } else
          targetChannelId = targetChannel.id;
      }

      args = args.slice(i+1,args.length+1);

      if (subcommand == 'set')
        await set(msg,targetChannelId,args);
      else if (subcommand == 'stats')
        await stats(msg,targetChannelId,args);
      else if (subcommand == 'top')
        await top(msg,targetChannelId,args);
      else if (subcommand == 'autopost')
        await autopost(msg,targetChannelId,args);
      else if (subcommand == 'reset')
        await reset(msg,targetChannelId,args);
      else {
        await msg.channel.send(errorMsgs.invalidSubcommand.replace('<prefix>',msg.guild.appData.prefix));
        return resolve();
      }
    } catch (e) { reject(e); }
    resolve();
  });
}
