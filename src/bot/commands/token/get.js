const errorMsgs = require('../../../const/errorMsgs.js');
const Discord = require('discord.js');

module.exports = (msg,args) => {
  return new Promise(async function (resolve, reject) {
    try {
      if (args.length < 1) {
        await msg.channel.send(errorMsgs.tooFewArguments.replace('<prefix>',msg.guild.appData.prefix));
        return resolve();
      }

      let field = args[0].toLowerCase();
      const value = args.slice(1,args.length+1).join(' ');

      if (field == 'externupvote')
        await externupvote(msg,value);
      else if (field == 'buy')
        await buy(msg,value);
      else {
        await msg.channel.send(errorMsgs.invalidArgument.replace('<prefix>',msg.guild.appData.prefix));
        return resolve();
      }
    } catch (e) { reject(e); }
    resolve();
  });
}

function externupvote(msg,value) {
  return new Promise(async function (resolve, reject) {
    try {
      let embed = new Discord.MessageEmbed()
          .setTitle('Upvote the bot on extern platforms to gain a few tokens.')
          .setColor('#4fd6c8')

      embed.addField('**[*3* tokens]** Top.gg (possible every 12h)', 'https://top.gg/bot/534589798267224065');

      await msg.channel.send({embeds:[embed]});

      resolve();
    } catch (e) { reject(e); }
  });
}

function buy(msg,value) {
  return new Promise(async function (resolve, reject) {
    try {
      let embed = new Discord.MessageEmbed()
          .setTitle('Buy tokens to fuel the bot and redeem for other boosts.')
          .setColor('#4fd6c8')

      embed.addField('**[ 1€ / *1000* tokens ]**','Visit https://activityrank.me/premium to purchase.');

      await msg.channel.send({embeds:[embed]});

      resolve();
    } catch (e) { reject(e); }
    resolve();
  });
}
