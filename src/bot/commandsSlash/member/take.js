const guildMemberModel = require('../../models/guild/guildMemberModel.js');
const statFlushCache = require('../../statFlushCache.js');

module.exports.execute = async (i) => {
  const member = i.options.getMember('member');
  await guildMemberModel.cache.load(member);

  await statFlushCache.addBonus(member, -i.options.getInteger('amount'));
  await i.reply({
    content: '✅ Successfully changed bonus XP.',
    ephemeral: true,
  });
};