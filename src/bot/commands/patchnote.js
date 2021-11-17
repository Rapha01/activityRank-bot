const guildModel = require('../models/guild/guildModel.js');
const Discord = require('discord.js');
const errorMsgs = require('../../const/errorMsgs.js');
const fct = require('../../util/fct.js');

module.exports = (msg,args) => {
  return new Promise(async function (resolve, reject) {
    try {
      let patchnotesEmbed = patchnotesVersionEmbed(JSON.parse(msg.client.appData.texts).patchnotes[0]);

      if (args.length > 0) {
        for (let patchnote of JSON.parse(msg.client.appData.texts).patchnotes) {
          if (patchnote.version == args[0].toLowerCase())
            patchnotesEmbed = patchnotesVersionEmbed(patchnote);
        }
      }

      console.info(patchnotesEmbed);
      await msg.channel.send({embeds:[patchnotesEmbed]});

      resolve();
    } catch (e) { reject(e); }
  });
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

  return embed;
}
