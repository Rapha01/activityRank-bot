const guildModel = require('../../../models/guild/guildModel.js');
const prettyTime = require('pretty-ms');


module.exports.execute = async function(i) {
  await guildModel.storage.set(i.guild, 'textMessageCooldownSeconds', i.options.getInteger('time'));
  await i.reply({
    content: `From now on, messages will only give XP if their author has not sent one in the last ${
      prettyTime(i.options.getInteger('time') * 1000, { verbose: true })}`,
    ephemeral: true,
  });
};

module.exports.autocomplete = async (i) => {
  i.respond([
    { name: 'No time', value: 0 },
    { name: '5 seconds', value: 5 },
    { name: '15 seconds', value: 15 },
    { name: '30 seconds', value: 30 },
    { name: '1 minute', value: 60 },
    { name: '2 minutes', value: 120 },
  ]);
};