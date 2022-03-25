const guildModel = require('../../../models/guild/guildModel.js');


module.exports.execute = async function(i) {
  const endsAt = (Date.now() / 1000) + i.options.getInteger('time') * 60;
  await guildModel.storage.set(i.guild, 'bonusUntilDate', endsAt);
  await i.reply({
    content: `Bonus time has started! It will end <t:${endsAt}:R>.`,
    ephemeral: true,
  });
};

module.exports.autocomplete = async (i) => {
  i.respond([
    { name: '1 hour', value: 60 },
    { name: '3 hours', value: 180 },
    { name: '12 hours', value: 720 },
    { name: '1 day', value: 1440 },
    { name: '2 days', value: 2880 },
    { name: '3 days', value: 4320 },
  ]);
};