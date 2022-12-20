const { PermissionFlagsBits } = require('discord.js');
const guildMemberModel = require('../../models/guild/guildMemberModel.js');
const statFlushCache = require('../../statFlushCache.js');

module.exports.execute = async (i) => {
  const member = i.options.getMember('member');
  await guildMemberModel.cache.load(member);
  if (!i.member.permissionsIn(i.channel).has(PermissionFlagsBits.ManageGuild)) {
    return await i.reply({
      content:
        'You need the permission to manage the server in order to use this command.',
      ephemeral: true,
    });
  }

  const change = i.options.getInteger('change', true);

  await statFlushCache.addBonus(member, change);
  await i.reply({
    content: `Successfully gave \`${change}\` bonus XP to ${member}!`,
    allowedMentions: { parse: [] },
  });
};
