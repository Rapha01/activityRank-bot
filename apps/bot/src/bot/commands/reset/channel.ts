import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  type ChatInputCommandInteraction,
  PermissionFlagsBits,
} from 'discord.js';
import nameUtil from '../../util/nameUtil.js';
import { subcommand } from '#bot/util/registry/command.js';
import { useConfirm } from '#bot/util/component.js';
import { requireUser } from '#bot/util/predicates.js';
import { ResetGuildChannelsStatistics } from '#bot/models/resetModel.js';

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
        required: true,
        channel_types: [
          ChannelType.GuildAnnouncement,
          ChannelType.GuildForum,
          ChannelType.GuildText,
          ChannelType.GuildVoice,
        ],
      },
    ],
  },
  async execute({ interaction }) {
    // because `channel` is a required argument, this will always be the submitted channel ID.
    // https://discord.dev/interactions/receiving-and-responding#interaction-object-application-command-interaction-data-option-structure
    const channelId = interaction.options.get('channel', true).value as string;
    const predicate = requireUser(interaction.user);

    const confirmRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(
          confirmButton.instanceId({
            data: { initialInteraction: interaction, targetId: channelId },
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

    const channelMention = nameUtil.getChannelMention(interaction.guild.channels.cache, channelId);

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
    const job = new ResetGuildChannelsStatistics(interaction.guild, [data.targetId]);

    await interaction.update({ content: 'Preparing to reset. Please wait...', components: [] });

    await job.plan();
    await job.logStatus(interaction);

    await job.runUntilComplete({
      onPause: async () => await job.logStatus(interaction),
      globalBufferTime: 100,
      jobBufferTime: 2000,
    });
    await job.logStatus(interaction);
  },
  async denyFn({ interaction }) {
    await interaction.update({ components: [], content: 'Reset cancelled.' });
  },
});
