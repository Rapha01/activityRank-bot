const guildModel = require('../../models/guild/guildModel.js');
const resetModel = require('../../models/resetModel.js');

module.exports.execute = async function(i) {
  await guildModel.storage.set(i.guild, 'levelFactor', i.options.getInteger('levelfactor'));
  resetModel.cache.resetGuildMembersAll(i.guild);
  i.reply({
    content: `Your levelfactor is now set to \`${i.options.getInteger('levelfactor')}\``,
    ephemeral: true,
  });
};