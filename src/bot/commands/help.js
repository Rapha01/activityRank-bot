const guildModel = require('../models/guild/guildModel.js');
const Discord = require('discord.js');
const errorMsgs = require('../../const/errorMsgs.js');

module.exports = (msg,args) => {
  return new Promise(async function (resolve, reject) {
    try {
      let helpEmbed = helpMainEmbed(msg.guild,msg.client.appData.texts.commands);

      if (args.length > 0) {
        for (section in msg.client.appData.texts.commands) {
          if (section.toLowerCase() == args[0].toLowerCase())
            helpEmbed = helpFeatureEmbed(msg.guild,msg.client.appData.texts.commands[section]);
        }
      }

      await msg.channel.send(helpEmbed);
      //await msg.channel.send('I have sent you the requested information.');

      resolve();
    } catch (e) { reject(e); }
  });
}

function helpMainEmbed (guild,sections) {
  const embed = new Discord.MessageEmbed()
    .setAuthor('ActivityRank Manual')
    .setColor(0x00AE86)
    //.setDescription('A level and stat bot. \n - Track users voice- and textchannel activity and grant XP for each.\n - Track most active voice- and textchannels.\n - Let users grant each other XP via social upvotes.\n - Auto assign and deassign roles upon reaching a certain level.\n - Customize XP granted for each activity and XP necessary for each subsequent level.')
    .setDescription('Website: *https://activityrank.me/commands*. \n Support server: *https://discord.com/invite/DE3eQ8H*. \n By using this bot you accept the terms and conditions: *https://activityrank.me/termsandconditions*.')
    .setImage('')
    .setThumbnail('')
  ;

  for (command in sections)
    embed.addField('***' + sections[command].title + '***', sections[command].desc + '\n Check ``'+ guild.appData.prefix + 'help ' + command + '`` for more infos.');

  return {embed};
}

function helpFeatureEmbed (guild,section) {
  const embed = new Discord.MessageEmbed()
    .setColor(0x00AE86)
    .setTitle('**Manual - ' + section.title+ '**')
    .setDescription(section.subdesc)
    .setImage('')
    .setThumbnail('');

  for (command of section.subcommands)
    embed.addField(command.title + '\n' + command.command.replace(/<prefix>/g,guild.appData.prefix),command.desc + '\nex.: ``' + command.example.replace(/<prefix>/g,guild.appData.prefix) + '``');

  return {embed};
}
