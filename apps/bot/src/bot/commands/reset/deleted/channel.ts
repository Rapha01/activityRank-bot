import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import nameUtil from '#bot/util/nameUtil.js';
import { command } from '#bot/commands.js';
import { useConfirm } from '#bot/util/component.js';
import { requireUser } from '#bot/util/predicates.js';
import {
  resetGuildChannelsSettings,
  ResetGuildChannelsStatistics,
} from '#bot/models/resetModel.js';

export default command({
  name: 'reset deleted channel',
  async execute({ interaction, options, t }) {
    const channelId = options.id;
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
      content: t('reset.channel', { channelMention }),
      ephemeral: true,
      components: [confirmRow],
    });
  },
});

const { confirmButton, denyButton } = useConfirm<{ targetId: string }>({
  async confirmFn({ interaction, data, t }) {
    const job = new ResetGuildChannelsStatistics(interaction.guild, [data.targetId]);

    await interaction.update({ content: t('reset.preparing'), components: [] });

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
  async denyFn({ interaction, t }) {
    await interaction.update({ components: [], content: t('reset.cancelled') });
  },
});
