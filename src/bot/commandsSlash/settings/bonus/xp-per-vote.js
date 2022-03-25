const guildModel = require('../../../models/guild/guildModel.js');

module.exports.execute = async function(i) {
  await guildModel.storage.set(i.guild, 'bonusPerVote', i.options.getInteger('amount'));
  i.reply({
    content: `Members will now gain an additional \`${i.options.getInteger('amount')}\` XP per upvote during bonus time!`,
    ephemeral: true,
  });
};