const { SlashCommandBuilder } = require('@discordjs/builders');
const guildMemberModel = require('../models/guild/guildMemberModel.js');
const statFlushCache = require('../statFlushCache.js');
const fct = require('../../util/fct.js');

module.exports.data = new SlashCommandBuilder()
  .setName('inviter')
  .setDescription('Set a member as your inviter')
  .addUserOption(o => o
    .setName('member')
    .setDescription('The user that invited you to the server')
    .setRequired(true));

module.exports.execute = async (i) => {
  const member = i.options.getMember('member');
  await guildMemberModel.cache.load(i.member);
  if (!i.guild.appData.inviteXp) {
    return await i.reply({
      content: 'The invite XP module is paused on this server.',
      ephemeral: true,
    });
  }
  if (member.id == i.member.id) {
    return await i.reply({
      content: 'You cannot be the inviter of yourself.',
      ephemeral: true,
    });
  }

  const myGuildMember = await guildMemberModel.storage.get(i.guild, i.member.id);
  const myTargetGuildMember = await guildMemberModel.storage.get(i.guild, member.id);

  if (myGuildMember.inviter != 0) {
    return await i.reply({
      content: 'You have already set your inviter. This setting is final.',
      ephemeral: true,
    });
  }
  if (myTargetGuildMember.inviter != 0 && myTargetGuildMember.inviter == i.member.id) {
    return await i.reply({
      content: 'You cannot set your inviter to a person who has been invited by you.',
      ephemeral: true,
    });
  }
  if (member.user.bot) {
    return await i.reply({
      content: 'You cannot set a bot as your inviter.',
      ephemeral: true,
    });
  }

  await guildMemberModel.cache.load(member);

  if (await fct.hasNoXpRole(member)) {
    return await i.reply({
      content: 'The member you are trying to set as your inviter cannot be selected, because of an assigned noXP role.',
      ephemeral: true,
    });
  }
  await guildMemberModel.storage.set(i.guild, i.member.id, 'inviter', member.id);

  await statFlushCache.addInvite(member, 1);
  await statFlushCache.addInvite(i.member, 1);

  return await i.reply({
    content: 'Your inviter has been set successfully. You will both get 1 invite added to your stats.',
    ephemeral: true,
  });
};