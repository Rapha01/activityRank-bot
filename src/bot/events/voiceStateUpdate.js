const noXpUtil = require('../util/noXpUtil.js');
const guildModel = require('../models/guild/guildModel.js');
const guildMemberModel = require('../models/guild/guildMemberModel.js');
const rankVoiceMember = require('../util/rankVoiceMember.js');

module.exports = (oldState, newState) => {
  return new Promise(async function (resolve, reject) {
    try {
      if (oldState.member.user.bot) return;

      if (oldState.channel == null && newState.channel != null && newState.member != null) {
        await guildModel.cache.load(newState.guild);
        await guildMemberModel.cache.load(newState.member);

        if (await noXpUtil.noVoiceXp(newState.channel,newState.member))
          return resolve();

        await rankVoiceMember.update(newState.member,newState.channel);
      } /*else if (newState.channel == null && oldState.channel != null && oldState.member != null) {
        await guildModel.cache.load(oldState.guild);
        await guildMemberModel.cache.load(oldState.member);
        await rankVoiceMember(oldState.member,oldState.channel);
      }*/

      resolve();
    } catch (e) { reject(e); }
  });
}
