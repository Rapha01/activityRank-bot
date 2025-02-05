import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import nameUtil from '#bot/util/nameUtil.js';
import { subcommand } from '#bot/commands.js';
import { useConfirm } from '#bot/util/component.js';
import { requireUser } from '#bot/util/predicates.js';
import {
  resetGuildChannelsSettings,
  ResetGuildChannelsStatistics,
} from '#bot/models/resetModel.js';

export const channel = subcommand({
  data: {
    name: 'channel',
    description: "Reset a deleted channel's statistics.",
    type: ApplicationCommandOptionType.Subcommand,
    options: [
      {
        name: 'id',
        description: 'The ID of the channel to reset.',
        type: ApplicationCommandOptionType.String,
        min_length: 17,
        max_length: 20,
        required: true,
      },
    ],
  },
  async execute({ interaction }) {
    const channelId = interaction.options.getString('id', true);
    if (!/^\d*$/.test(channelId)) {
      await interaction.reply({ content: 'Discord IDs are always numbers.', ephemeral: true });
      return;
    }

    const predicate = requireUser(interaction.user);

    const confirmRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(confirmButton.instanceId({ data: { targetId: channelId }, predicate }))
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

const { confirmButton, denyButton } = useConfirm<{ targetId: string }>({
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
    await resetGuildChannelsSettings(interaction.guild, [data.targetId]);
    await job.logStatus(interaction);
  },
  async denyFn({ interaction }) {
    await interaction.update({ components: [], content: 'Reset cancelled.' });
  },
});
