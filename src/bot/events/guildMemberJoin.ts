import guildMemberModel from '../models/guild/guildMemberModel.js';
import levelManager from '../levelManager.js';
import guildModel from '../models/guild/guildModel.js';
import fct from '../../util/fct.js';
import Discord from 'discord.js';

export default {
  name: '_guildMemberJoin',
  execute(member) {
    return new Promise(async function (resolve, reject) {
      try {
        if (member.user.bot) return;
        await guildModel.cache.load(member.guild);
        await guildMemberModel.cache.load(member);

        // Roleassignments
        const level = fct.getLevel(
          fct.getLevelProgression(
            member.appData.totalScore,
            member.guild.appData.levelFactor
          )
        );
        const roleAssignmentString = await levelManager.checkRoleAssignment(
          member,
          level
        );

        // AutoPost serverjoin
        if (member.guild.appData.autopost_serverJoin != 0)
          await autoPostServerJoin(member, roleAssignmentString);

        resolve();
      } catch (e) {
        reject(e);
      }
    });
  },
};

const autoPostServerJoin = (member, roleAssignmentString) => {
  return new Promise(async function (resolve, reject) {
    try {
      const channel = member.guild.channels.cache.get(
        member.guild.appData.autopost_serverJoin
      );
      if (!channel) return resolve();

      if (!channel.viewable) return resolve();

      let welcomeMessage;
      if (member.guild.appData.serverJoinMessage != '')
        welcomeMessage = member.guild.appData.serverJoinMessage;
      else welcomeMessage = 'Welcome <mention>. Have a good time here!';

      welcomeMessage = welcomeMessage + '\n' + roleAssignmentString;
      welcomeMessage = welcomeMessage
        .replace(/<mention>/g, '<@' + member.id + '>')
        .replace(/<name>/g, member.user.username)
        .replace(/<servername>/g, member.guild.name);

      const welcomeEmbed = new Discord.EmbedBuilder()
        .setTitle(member.user.username)
        .setColor('#4fd6c8')
        .setDescription(welcomeMessage)
        .setThumbnail(member.user.avatarURL({ dynamic: true }));

      try {
        await channel.send({
          content: `<@${member.id}>`,
          embeds: [welcomeEmbed],
        });
      } catch (err) {
        if (err.code === 50013)
          // Missing Permissions
          member.client.logger.debug(
            `Failed to send welcome message in guild ${member.guild.id}`
          );
        else throw err;
      }

      resolve();
    } catch (e) {
      reject(e);
    }
  });
};
