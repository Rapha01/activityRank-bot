import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { subcommand } from '#bot/commands.js';
import { useConfirm } from '#bot/util/component.js';
import { requireUser } from '#bot/util/predicates.js';
import {
  fetchDeletedChannelIds,
  resetGuildChannelsSettings,
  ResetGuildChannelsStatistics,
} from '#bot/models/resetModel.js';

export const channels = subcommand({
  data: {
    name: 'channels',
    description: 'Reset the statistics of all deleted channels.',
    type: ApplicationCommandOptionType.Subcommand,
  },
  async execute({ interaction }) {
    const channelIds = await fetchDeletedChannelIds(interaction.guild);

    if (channelIds.length < 1) {
      await interaction.reply({ content: 'There are no deleted channels to reset.' });
      return;
    }

    const predicate = requireUser(interaction.user);

    const confirmRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(confirmButton.instanceId({ data: { channelIds }, predicate }))
        .setLabel('Reset')
        .setEmoji('✅')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(denyButton.instanceId({ predicate }))
        .setLabel('Cancel')
        .setEmoji('❎')
        .setStyle(ButtonStyle.Secondary),
    );

    await interaction.reply({
      content: `Are you sure you want to reset all the statistics of **all ${channelIds.length} deleted channels in the server**?\n\n**This cannot be undone.**`,
      ephemeral: true,
      components: [confirmRow],
    });
  },
});

const { confirmButton, denyButton } = useConfirm<{ channelIds: string[] }>({
  async confirmFn({ interaction, data }) {
    const job = new ResetGuildChannelsStatistics(interaction.guild, data.channelIds);

    await interaction.update({ content: 'Preparing to reset. Please wait...', components: [] });

    await job.plan();
    await job.logStatus(interaction);

    await job.runUntilComplete({
      onPause: async () => await job.logStatus(interaction),
      globalBufferTime: 100,
      jobBufferTime: 2000,
    });
    await resetGuildChannelsSettings(interaction.guild, data.channelIds);
    await job.logStatus(interaction);
  },
  async denyFn({ interaction }) {
    await interaction.update({ components: [], content: 'Reset cancelled.' });
  },
});
