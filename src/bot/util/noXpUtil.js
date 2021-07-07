const guildRoleModel = require('../models/guild/guildRoleModel.js');

exports.noVoiceXp = (member,channel) => {
  return new Promise(async function(resolve, reject) {
    try {
      if (member.user.bot)
        return resolve(true);

      if (!member.guild.appData.allowMutedXp && (member.voice.selfMute || member.voice.serverMute))
        return resolve(true);

      if (!member.guild.appData.allowDeafenedXp && (member.voice.selfDeaf || member.voice.serverDeaf))
        return resolve(true);

      if (!member.guild.appData.allowSoloXp && channel.members.size < 2)
        return resolve(true);

      //if (!member.guild.appData.allowInvisibleXp && member.user.presence.status == 'offline')
        //return resolve(true);

      for (let role of member.roles.cache) {
        role = role[1];
        await guildRoleModel.cache.load(role);

        if (role.appData.noXp)
          return resolve(true);
      }

      return resolve(false);
    } catch (e) { reject(e); }
  });
}
