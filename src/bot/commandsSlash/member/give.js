const guildMemberModel = require('../../models/guild/guildMemberModel.js');
const statFlushCache = require('../../statFlushCache.js');

module.exports.execute = async (i) => {
  const member = i.options.getMember('member');
  await guildMemberModel.cache.load(member);
  if (!i.member.permissionsIn(i.channel).has('MANAGE_GUILD')) {
    return await i.reply({
      content: 'You need the permission to manage the server in order to use this command.',
      ephemeral: true,
    });
  }

  await statFlushCache.addBonus(member, i.options.getInteger('amount'));
  await i.reply({
    content: `Successfully gave ${i.options.getInteger('amount')} bonus XP to ${member}!`,
  });
};