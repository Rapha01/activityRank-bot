import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { command } from '#bot/commands.js';
import { useConfirm } from '#bot/util/component.js';
import { requireUser } from '#bot/util/predicates.js';
import {
  fetchDeletedChannelIds,
  resetGuildChannelsSettings,
  ResetGuildChannelsStatistics,
} from '#bot/models/resetModel.js';

export default command({
  name: 'reset deleted channels',
  async execute({ interaction, t }) {
    const channelIds = await fetchDeletedChannelIds(interaction.guild);

    if (channelIds.length < 1) {
      await interaction.reply({ content: t('reset.deleted.noChannelsToReset') });
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
      content: t('reset.deleted.confirmationChannel', { size: channelIds.length }),
      ephemeral: true,
      components: [confirmRow],
    });
  },
});

const { confirmButton, denyButton } = useConfirm<{ channelIds: string[] }>({
  async confirmFn({ interaction, data, t }) {
    const job = new ResetGuildChannelsStatistics(interaction.guild, data.channelIds);

    await interaction.update({ content: t('reset.preparing'), components: [] });

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
  async denyFn({ interaction, t }) {
    await interaction.update({ components: [], content: t('reset.cancelled') });
  },
});
