const cooldownUtil = require('../../util/cooldownUtil.js');
const resetModel = require('../../models/resetModel.js');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports.execute = async (i) => {
  if (!i.member.permissionsIn(i.channel).has(PermissionFlagsBits.ManageGuild)) {
    return await i.reply({
      content: 'You need the permission to manage the server in order to use this command.',
      ephemeral: true,
    });
  }

  const field = i.options.getString('type');
  if (field == 'stop') {
    delete resetModel.resetJobs[i.guild.id];

    return await i.reply({
      content: 'Stopped reset.',
      ephemeral: true,
    });
  }

  if (!await cooldownUtil.checkResetServerCommandCooldown(i)) return;
  const confirmRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ignore confirm')
      .setLabel('Reset')
      .setEmoji('✅')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('ignore cancel')
      .setLabel('Cancel')
      .setEmoji('❎')
      .setStyle(ButtonStyle.Secondary),
  );
  const msg = await i.reply({
    content: 'Are you sure you want to reset these statistics?',
    ephemeral: true,
    fetchReply: true,
    components: [confirmRow],
  });
  const filter = (interaction) => interaction.user.id === i.user.id;
  try {
    const interaction = await msg.awaitMessageComponent({ filter, time: 15_000 });
    if (interaction.customId.split(' ')[1] === 'confirm') {
      if (field == 'deletedmembers') {
        const userIds = await resetModel.storage.getDeletedUserIds(i.guild);

        resetModel.resetJobs[i.guild.id] = { type: 'guildMembersStats', ref: i, cmdChannel: i.channel, userIds: userIds };
        await interaction.reply({
          content: 'Resetting, please wait...',
          ephemeral: true,
        });
      } else if (field == 'deletedchannels') {
        const channelIds = await resetModel.storage.getDeletedChannelIds(i.guild);

        resetModel.resetJobs[i.guild.id] = { type: 'guildChannelsStats', ref: i, cmdChannel: i.channel, channelIds: channelIds };
        await interaction.reply({
          content: 'Resetting, please wait...',
          ephemeral: true,
        });
      } else if (
        field == 'all'
        || field == 'stats'
        || field == 'settings'
        || field == 'textstats'
        || field == 'voicestats'
        || field == 'invitestats'
        || field == 'votestats'
        || field == 'bonusstats'
      ) {
        resetModel.resetJobs[i.guild.id] = { type: field, cmdChannel: i.channel };
        await interaction.reply({
          content: 'Resetting, please wait...',
          ephemeral: true,
        });
      } else {
        console.warn('[/reset server] Invalid field');
      }
      i.guild.appData.lastResetServer = Date.now() / 1000;
    } else {
      interaction.reply({
        content: 'Reset cancelled.',
        ephemeral: true,
      });
    }
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
