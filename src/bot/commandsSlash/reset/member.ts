import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  DiscordjsErrorCodes,
  PermissionFlagsBits,
  type DiscordjsError,
  type Interaction,
} from 'discord.js';
import resetModel from '../../models/resetModel.js';
import nameUtil from '../../util/nameUtil.js';
import { parseMember } from '../../util/parser.js';
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

    const resolvedMember = await parseMember(interaction);

    if (!resolvedMember) {
      return await interaction.reply({
        content: "You need to specify either a member or a member's ID!",
        ephemeral: true,
      });
    }

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
      content: `Are you sure you want to reset all the statistics of ${nameUtil.getGuildMemberMention(
        interaction.guild.members.cache,
        resolvedMember.id,
      )}?`,
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
        resetModel.resetJobs[interaction.guild.id] = {
          type: 'guildMembersStats',
          ref: interaction,
          cmdChannel: interaction.channel!,
          userIds: [resolvedMember.id],
        };
        return buttonInteraction.reply({
          content: 'Resetting, please wait...',
          ephemeral: true,
        });
      }
      await buttonInteraction.reply({
        content: 'Reset cancelled.',
        ephemeral: true,
      });
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
