const guildMemberModel = require('../models/guild/guildMemberModel.js');
const levelManager = require('../levelManager.js');
const guildModel = require('../models/guild/guildModel.js');
const fct = require('../../util/fct.js');
const rankModel = require('../models/rankModel.js');
const Discord = require('discord.js');

module.exports = (member) => {
  return new Promise(async function (resolve, reject) {
    try {
      if (member.user.bot)
        return;

      await guildModel.cache.load(member.guild);

      // Stats
      await guildMemberModel.cache.load(member);

      // Roleassignments
      const level = fct.getLevel(fct.getLevelProgression(member.appData.totalScore,member.guild.appData.levelFactor));
      const roleAssignmentString = await levelManager.checkRoleAssignment(member,level);

      // Activityboard
      await autoPostServerJoin(member,roleAssignmentString);

      resolve();
    } catch (e) { reject(e); }
  });
}

const autoPostServerJoin = (member,roleAssignmentString) => {
  return new Promise(async function (resolve, reject) {
    try {
      if (member.guild.appData.autopost_serverJoin == 0)
        return resolve();

      const channel = member.guild.channels.cache.get(member.guild.appData.autopost_serverJoin);
      if (!channel)
        return resolve();

      let welcomeMessage;
      if (member.guild.appData.serverJoinMessage != '')
        welcomeMessage = member.guild.appData.serverJoinMessage;
      else
        welcomeMessage = 'Welcome <mention>. Have a good time here!';

      welcomeMessage = welcomeMessage + '\n' + roleAssignmentString;
      welcomeMessage = welcomeMessage.replace(/<mention>/g,'<@' + member.id + '>').replace(/<name>/g,member.user.username).replace(/<servername>/g,member.guild.name).replace(/<level>/g,'1');

      const welcomeEmbed = new Discord.MessageEmbed()
          .setTitle(member.user.username)
          .setAuthor('')
          .setColor('#4fd6c8')
          .setDescription(welcomeMessage)
          .setThumbnail(member.user.avatarURL())

      await channel.send('<@' + member.id + '>',welcomeEmbed);

      resolve();
    } catch (e) { reject(e); }
  });
};
