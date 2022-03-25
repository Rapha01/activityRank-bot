const guildModel = require('../../../models/guild/guildModel.js');

module.exports.execute = async function(i) {
  if (i.options.getString('tag').length > 20) {
    return i.reply({
      content: 'Please use a tag with a length of 20 characters or less.',
      ephemeral: true,
    });
  }

  await guildModel.storage.set(i.guild, 'voteTag', i.options.getString('tag'));
  i.reply({
    content: `Your vote tag is now set to \`${i.options.getString('tag')}\``,
    ephemeral: true,
  });
};