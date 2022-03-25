const guildModel = require('../../../models/guild/guildModel.js');
const resetModel = require('../../../models/resetModel.js');

module.exports.execute = async function(i) {
  await guildModel.storage.set(i.guild, 'xpPerInvite', i.options.getInteger('amount'));
  resetModel.cache.resetGuildMembersAll(i.guild);
  i.reply({
    content: `Members will now gain \`${i.options.getInteger('amount')}\` XP per member that sets them as their inviter!`,
    ephemeral: true,
  });
};