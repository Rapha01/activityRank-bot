import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
} from 'discord.js';
import resetModel from '../../models/resetModel.js';
import nameUtil from '../../util/nameUtil.js';
import { ParserResponseStatus, parseChannel } from '../../util/parser.js';
import { subcommand } from 'bot/util/registry/command.js';
import { useConfirm } from 'bot/util/component.js';
import { requireUser } from 'bot/util/predicates.js';

export const channel = subcommand({
  data: {
    name: 'channel',
    description: "Reset a channel's statistics.",
    type: ApplicationCommandOptionType.Subcommand,
    options: [
      {
        name: 'channel',
        description: 'The channel to reset.',
        type: ApplicationCommandOptionType.Channel,
      },
      {
        name: 'id',
        description: 'The ID of the channel to reset.',
        type: ApplicationCommandOptionType.String,
        min_length: 17,
        max_length: 20,
      },
    ],
  },
  async execute({ interaction }) {
    // TODO deprecate in favour of native Discord slash command permissions
    if (
      !interaction.channel ||
      !interaction.member.permissionsIn(interaction.channel).has(PermissionFlagsBits.ManageGuild)
    ) {
      await interaction.reply({
        content: 'You need the permission to manage the server in order to use this command.',
        ephemeral: true,
      });
      return;
    }

    const resolvedChannel = parseChannel(interaction);
    if (resolvedChannel.status === ParserResponseStatus.ConflictingInputs) {
      await interaction.reply({
        content: `You have specified both a channel and an ID, but they don't match.\nDid you mean: "/reset channel channel:${interaction.options.get('channel')!.value}"?`,
        ephemeral: true,
      });
      return;
    } else if (resolvedChannel.status === ParserResponseStatus.NoInput) {
      await interaction.reply({
        content: "You need to specify either a channel or a channel's ID!",
        ephemeral: true,
      });
      return;
    }

    const predicate = requireUser(interaction.user);

    const confirmRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(
          confirmButton.instanceId({
            data: { initialInteraction: interaction, targetId: resolvedChannel.id },
            predicate,
          }),
        )
        .setLabel('Reset')
        .setEmoji('✅')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(denyButton.instanceId({ predicate }))
        .setLabel('Cancel')
        .setEmoji('❎')
        .setStyle(ButtonStyle.Secondary),
    );

    const channelMention = nameUtil.getChannelMention(
      interaction.guild.channels.cache,
      resolvedChannel.id,
    );

    await interaction.reply({
      content: `Are you sure you want to reset all the statistics of ${channelMention}?`,
      ephemeral: true,
      components: [confirmRow],
    });
  },
});

const { confirmButton, denyButton } = useConfirm<{
  initialInteraction: ChatInputCommandInteraction<'cached'>;
  targetId: string;
}>({
  async confirmFn({ interaction, data }) {
    resetModel.resetJobs[interaction.guild.id] = {
      type: 'guildChannelsStats',
      ref: data.initialInteraction,
      cmdChannel: data.initialInteraction.channel!,
      channelIds: [data.targetId],
    };
    await interaction.update({ components: [], content: 'Resetting, please wait...' });
  },
  async denyFn({ interaction }) {
    await interaction.update({ components: [], content: 'Reset cancelled.' });
  },
});
