const guildModel = require('../models/guild/guildModel.js');
const Discord = require('discord.js');
const errorMsgs = require('../../const/errorMsgs.js');

module.exports = (msg,args) => {
  return new Promise(async function (resolve, reject) {
    try {
      let patchnotesEmbed = patchnotesMainEmbed(msg.client.appData.texts.patchnotes);
      if (args.length > 0) {
        for (let patchnote of msg.client.appData.texts.patchnotes) {
          if (patchnote.version == args[0].toLowerCase())
            patchnotesEmbed = patchnotesVersionEmbed(patchnote);
        }
      }

      await msg.channel.send(patchnotesEmbed);
      //await msg.channel.send('I have sent you the requested information.');

      resolve();
    } catch (e) { reject(e); }
  });
}

function patchnotesMainEmbed (patchnotes) {
  const embed = new Discord.MessageEmbed()
    .setTitle('**ActivityRank Patchnotes**')
    .setColor(0x00AE86)
    .setDescription('Check what\'s going on with ActivityRank bot. Add the version number to the command to see the version details. Like so: ``ar!patchnotes 3.0``')
    .setImage('')
    .setThumbnail('')
  ;

  for (patchnote of patchnotes) {
    embed.addField('Patch ' + patchnote.version + ' - ' + patchnote.title + ' (' + patchnote.date + ')' + '',patchnote.desc);
  }

  return {embed};
  console.log(features);
}

function patchnotesVersionEmbed (patchnote) {
  const embed = new Discord.MessageEmbed()
    .setColor(0x00AE86)
    .setTitle('**Patch ' + patchnote.version + ' - ' + patchnote.title + ' (' + patchnote.date + ')' + '**')
    .setImage('')
    .setThumbnail('');

  for (let feature of patchnote.features)
    embed.addField(feature.title,feature.desc);

  for (let fix of patchnote.fixes)
    embed.addField(fix.title,fix.desc);

  return {embed};
}
