const guildModel = require('../models/guild/guildModel.js');
const guildMemberModel = require('../models/guild/guildMemberModel.js');

module.exports = {
  name: 'voiceStateUpdate',
  execute(oldState, newState) {
    return new Promise(async function (resolve, reject) {
      try {
        const member = await oldState.member;
        if (!member) return resolve();
        if (!member.user) return resolve();
        if (member.user.bot) return resolve();

        await guildModel.cache.load(oldState.guild);
        await guildMemberModel.cache.load(member);

        if (
          oldState.channel == null &&
          newState.channel != null &&
          newState.member != null
        ) {
          // Join
        } else if (
          newState.channel == null &&
          oldState.channel != null &&
          oldState.member != null
        ) {
          // Leave
        } else {
          // Switch or mute
        }

        resolve();
      } catch (e) {
        reject(e);
      }
    });
  },
};
