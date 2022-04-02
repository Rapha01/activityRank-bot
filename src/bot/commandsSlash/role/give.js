const guildMemberModel = require('../../models/guild/guildMemberModel.js');
const guildRoleModel = require('../../models/guild/guildRoleModel.js');
const statFlushCache = require('../../statFlushCache.js');
const { oneLine } = require('common-tags');

module.exports.execute = async (i) => {
  const role = i.options.getRole('role');
  if (!i.member.permissionsIn(i.channel).has('MANAGE_GUILD')) {
    return await i.reply({
      content: 'You need the permission to manage the server in order to use this command.',
      ephemeral: true,
    });
  }

  await guildRoleModel.cache.load(role);

  const members = await i.guild.members.fetch({ cache: false, withPresences: false, force: true });
  console.log('Role give members ', members.size);

  let affected = 0;
  for (let member of members) {
    member = member[1];
    if (member.roles.cache.has(role.id)) {
      await guildMemberModel.cache.load(member);
      await statFlushCache.addBonus(member, i.options.getInteger('amount'));
      affected++;
    }
  }
  console.log('Role give affected members', affected);

  await i.reply({
    content: oneLine`Successfully gave ${i.options.getInteger('amount')} bonus XP 
      to ${affected} member${affected == 1 ? '' : 's'} with role ${role}`,
    allowedMentions: { 'parse': [] },
  });
};