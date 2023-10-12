import cooldownUtil from '../../util/cooldownUtil.js';
import resetModel from '../../models/resetModel.js';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  DiscordjsErrorCodes,
  type DiscordjsError,
  type Interaction,
} from 'discord.js';
import { ComponentKey, registerSubCommand } from 'bot/util/commandLoader.js';

registerSubCommand({
  async execute(interaction) {
    if (
      !interaction.member.permissionsIn(interaction.channel!).has(PermissionFlagsBits.ManageGuild)
    ) {
      return await interaction.reply({
        content: 'You need the permission to manage the server in order to use this command.',
        ephemeral: true,
      });
    }

    const field = interaction.options.getString('type');
    if (field == 'stop') {
      delete resetModel.resetJobs[interaction.guild.id];

      return await interaction.reply({
        content: 'Stopped reset.',
        ephemeral: true,
      });
    }

    if (!(await cooldownUtil.checkResetServerCommandCooldown(interaction))) return;
    const confirmRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`${ComponentKey.Ignore} confirm`)
        .setLabel('Reset')
        .setEmoji('✅')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`${ComponentKey.Ignore} cancel`)
        .setLabel('Cancel')
        .setEmoji('❎')
        .setStyle(ButtonStyle.Secondary),
    );
    const msg = await interaction.reply({
      content: 'Are you sure you want to reset these statistics?',
      ephemeral: true,
      fetchReply: true,
      components: [confirmRow],
    });

    const filter = (filterInteraction: Interaction<'cached'>) =>
      filterInteraction.user.id === interaction.user.id;

    try {
      const buttonInteraction = await msg.awaitMessageComponent({
        filter,
        time: 15_000,
      });
      if (buttonInteraction.customId.split(' ')[1] === 'confirm') {
        if (field == 'deletedmembers') {
          const userIds = await resetModel.storage.getDeletedUserIds(interaction.guild);

          resetModel.resetJobs[interaction.guild.id] = {
            type: 'guildMembersStats',
            ref: interaction,
            cmdChannel: interaction.channel!,
            userIds: userIds,
          };
          await buttonInteraction.reply({
            content: 'Resetting, please wait...',
            ephemeral: true,
          });
        } else if (field == 'deletedchannels') {
          const channelIds = await resetModel.storage.getDeletedChannelIds(interaction.guild);

          resetModel.resetJobs[interaction.guild.id] = {
            type: 'guildChannelsStats',
            ref: interaction,
            cmdChannel: interaction.channel!,
            channelIds: channelIds,
          };
          await buttonInteraction.reply({
            content: 'Resetting, please wait...',
            ephemeral: true,
          });
        } else if (
          field == 'all' ||
          field == 'stats' ||
          field == 'settings' ||
          field == 'textstats' ||
          field == 'voicestats' ||
          field == 'invitestats' ||
          field == 'votestats' ||
          field == 'bonusstats'
        ) {
          resetModel.resetJobs[interaction.guild.id] = {
            type: field,
            ref: interaction,
            cmdChannel: interaction.channel!,
          };
          await buttonInteraction.reply({
            content: 'Resetting, please wait...',
            ephemeral: true,
          });
        } else {
          console.warn(`[/reset server] Invalid field ${field}`);
        }
        interaction.guild.appData.lastResetServer = Date.now() / 1000;
      } else {
        buttonInteraction.reply({
          content: 'Reset cancelled.',
          ephemeral: true,
        });
      }
    } catch (_err) {
      const err = _err as DiscordjsError;
      if (err.code === DiscordjsErrorCodes.InteractionCollectorError) {
        await interaction.followUp({
          content: 'Action timed out.',
          ephemeral: true,
        });
      } else throw _err;
    }
  },
});
