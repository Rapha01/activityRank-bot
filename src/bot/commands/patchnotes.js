const guildModel = require('../models/guild/guildModel.js');
const Discord = require('discord.js');
const errorMsgs = require('../../const/errorMsgs.js');
const fct = require('../../util/fct.js');

module.exports = (msg,args) => {
  return new Promise(async function (resolve, reject) {
    try {
      const page = fct.extractPage(args,msg.guild.appData.entriesPerPage);

      if (page.number < 1 || page.number > 100) {
        await msg.channel.send('Pagenumber needs to be within 1 and 100.');
        return resolve();
      }

      const patchnotes = msg.client.appData.texts.patchnotes.slice(page.from - 1,msg.guild.appData.entriesPerPage);

      await msg.channel.send(patchnotesMainEmbed(patchnotes));
      //await msg.channel.send('I have sent you the requested information.');

      resolve();
    } catch (e) { reject(e); }
  });
}

function patchnotesMainEmbed (patchnotes) {
  const embed = new Discord.MessageEmbed()
    .setTitle('**ActivityRank Patchnotes**')
    .setColor(0x00AE86)
    .setDescription('Check what\'s going on with ActivityRank bot. Use the patchnote command to see the version details. Like so: ``ar!patchnote 3.0``')
    .setImage('')
    .setThumbnail('')
  ;

  for (patchnote of patchnotes) {
    embed.addField('Patch ' + patchnote.version + ' - ' + patchnote.title + ' (' + patchnote.date + ')' + '',patchnote.desc);
  }

  return {embed};
}
