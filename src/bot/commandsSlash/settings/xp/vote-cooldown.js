const guildModel = require('../../../models/guild/guildModel.js');
const prettyTime = require('pretty-ms');


module.exports.execute = async function(i) {
  await guildModel.storage.set(i.guild, 'voteCooldownSeconds', i.options.getInteger('time'));
  await i.reply({
    content: `From now on, messages will only give XP if their author has not sent one in the last ${
      prettyTime(i.options.getInteger('time') * 1000, { verbose: true })}`,
    ephemeral: true,
  });
};

module.exports.autocomplete = async (i) => {
  i.respond([
    { name: '3 mins', value: 180 },
    { name: '5 mins', value: 300 },
    { name: '10 mins', value: 600 },
    { name: '30 mins', value: 1800 },
    { name: '1 hour', value: 3600 },
    { name: '3 hours', value: 10800 },
    { name: '6 hours', value: 21600 },
    { name: '12 hours', value: 43200 },
    { name: '24 hours', value: 86400 },
  ]);
};