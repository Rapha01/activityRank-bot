const guildModel = require('../../../models/guild/guildModel.js');

module.exports.execute = async function(i) {
  if (i.options.getString('emote').length > 64) {
    return i.reply({
      content: 'Please use a correct emote.',
      ephemeral: true,
    });
  }

  await guildModel.storage.set(i.guild, 'voteEmote', i.options.getString('emote'));
  i.reply({
    content: `Your vote emote is now set to \`${i.options.getString('emote')}\``,
    ephemeral: true,
  });
};