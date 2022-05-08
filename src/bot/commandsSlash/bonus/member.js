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

  const give = i.options.getInteger('give') || 0;
  const take = i.options.getInteger('take') || 0;
  const val = give - take;
  if (val === 0) {
    return await i.reply({
      content: 'You cannot give/take 0 XP!',
      ephemeral: true,
    });
  }

  await statFlushCache.addBonus(member, val);
  await i.reply({
    content: `Successfully gave \`${val}\` bonus XP to ${member}!`,
    allowedMentions: { parse: [] },
  });
};