const { MessageActionRow, MessageButton } = require('discord.js');
const resetModel = require('../../models/resetModel.js');
const nameUtil = require('../../util/nameUtil');
const { parseMember } = require('../../util/parser');


module.exports.execute = async (i) => {
  if (!i.member.permissionsIn(i.channel).has('MANAGE_GUILD'))
    return await i.reply({
      content: 'You need the permission to manage the server in order to use this command.',
      ephemeral: true,
    });

  const resolvedMember = await parseMember(i);

  if (!resolvedMember)
    return await i.reply({
      content: 'You need to specify either a member or a member\'s ID!',
      ephemeral: true,
    });

  const confirmRow = new MessageActionRow().addComponents(
    new MessageButton()
      .setCustomId('ignore confirm')
      .setLabel('Reset')
      .setEmoji('✅')
      .setStyle('DANGER'),
    new MessageButton()
      .setCustomId('ignore cancel')
      .setLabel('Cancel')
      .setEmoji('❎')
      .setStyle('SECONDARY'),
  );
  const msg = await i.reply({
    content: `Are you sure you want to reset all the statistics of ${nameUtil.getGuildMemberMention(i.guild.members.cache, resolvedMember.id)}?`,
    ephemeral: true,
    fetchReply: true,
    components: [confirmRow],
  });
  const filter = (interaction) => interaction.user.id === i.user.id;
  try {
    const interaction = await msg.awaitMessageComponent({ filter, time: 15_000 });
    if (interaction.customId.split(' ')[1] === 'confirm') {
      resetModel.resetJobs[i.guild.id] = { type: 'guildMembersStats', ref: i, cmdChannel: i.channel, userIds: [resolvedMember.id] };
      return interaction.reply({
        content: 'Resetting, please wait...',
        ephemeral: true,
      });
    }
    await interaction.reply({
      content: 'Reset cancelled.',
      ephemeral: true,
    });
  } catch (e) {
    if (e.name === 'Error [INTERACTION_COLLECTOR_ERROR]') {
      await i.followUp({
        content: 'Action timed out.',
        ephemeral: true,
      });
    } else {
      throw e;
    }
  }
};
