const guildModel = require('../../../models/guild/guildModel.js');


module.exports.execute = async function(i) {
  if (!i.member.permissionsIn(i.channel).has('MANAGE_GUILD')) {
    return await i.reply({
      content: 'You need the permission to manage the server in order to use this command.',
      ephemeral: true,
    });
  }

  if (!i.options.getChannel('channel')) {
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