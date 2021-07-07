const guildModel = require('../models/guild/guildModel.js');
const guildMemberModel = require('../models/guild/guildMemberModel.js');
const rankVoiceMember = require('../util/rankVoiceMember.js');

module.exports = (oldState, newState) => {
  return new Promise(async function (resolve, reject) {
    try {
      await oldState.guild.members.fetch(oldState.id);

      if (!oldState.member)
        return resolve();
      if (oldState.member.user.bot)
        return resolve();

      if (oldState.channel == null && newState.channel != null && newState.member != null) {
        await guildModel.cache.load(newState.guild);
        await guildMemberModel.cache.load(newState.member);

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
