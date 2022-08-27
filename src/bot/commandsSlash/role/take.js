const guildRoleModel = require('../../models/guild/guildRoleModel.js');
const { changeXp, currentlyProcessing } = require('../../util/roleXpUtil.js');

module.exports.execute = async (i) => {
  const role = i.options.getRole('role');
  if (!i.member.permissionsIn(i.channel).has('MANAGE_GUILD')) {
    return await i.reply({
      content: 'You need the permission to manage the server in order to use this command.',
      ephemeral: true,
    });
  }

  if (currentlyProcessing.has(i.guild.id)) {
    return await i.reply({
      content: 'A mass role operation is already in effect in this server!',
      ephemeral: true,
    });
  }

  await guildRoleModel.cache.load(role);

  await i.deferReply();

  let amount = i.options.getInteger('amount');
  if (amount === 0) {
    return await i.reply({
      content: 'You cannot give `0` XP.',
      ephemeral: true,
    });
  }
  amount = -amount;

  await changeXp(i, role.id, amount);
};