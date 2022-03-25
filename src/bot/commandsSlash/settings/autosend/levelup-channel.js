const guildModel = require('../../../models/guild/guildModel.js');


module.exports.execute = async function(i) {
  if ((i.options.getBoolean('disable') !== undefined) && i.options.getChannel('channel')) {
    return i.reply({
      content: 'Please only select one of the two options',
      ephemeral: true,
    });
  }
  if ((i.options.getBoolean('disable') === undefined) && !i.options.getChannel('channel')) {
    return i.reply({
      content: 'You must select __one__ of the provided options.',
      ephemeral: true,
    });
  }
  if (i.options.getBoolean('disable')) {
    await guildModel.storage.set(i.guild, 'autopost_levelup', 0);
    return i.reply({
      content: 'Removed levelup channel.',
      ephemeral: true,
    });
  } else {
    await guildModel.storage.set(i.guild, 'autopost_levelup', i.options.getChannel('channel').id);
    return i.reply({
      content: `Levelup messages will now be sent to ${i.options.getChannel('channel')}.`,
      ephemeral: true,
    });
  }
};