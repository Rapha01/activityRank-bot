import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { command } from '#bot/commands.js';
import { fetchDeletedUserIds, ResetGuildMembersStatisticsAndXp } from '#bot/models/resetModel.js';
import { useConfirm } from '#bot/util/component.js';
import { requireUser } from '#bot/util/predicates.js';

export default command({
  name: 'reset deleted members',
  async execute({ interaction, t }) {
    const userIds = await fetchDeletedUserIds(interaction.guild);

    if (userIds.length < 1) {
      await interaction.reply({ content: t('reset.deleted.noUsersToReset') });
      return;
    }

    const predicate = requireUser(interaction.user);

    const confirmRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(confirmButton.instanceId({ data: { userIds }, predicate }))
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
      content: t('reset.deleted.confirmationUser', { size: userIds.length }),
      ephemeral: true,
      components: [confirmRow],
    });
  },
});

const { confirmButton, denyButton } = useConfirm<{ userIds: string[] }>({
  async confirmFn({ interaction, data, t }) {
    const job = new ResetGuildMembersStatisticsAndXp(interaction.guild, data.userIds);

    await interaction.update({ content: t('reset.preparing'), components: [] });

    await job.plan();
    await job.logStatus(interaction);

    await job.runUntilComplete({
      onPause: async () => await job.logStatus(interaction),
      globalBufferTime: 100,
      jobBufferTime: 2000,
    });
    await job.logStatus(interaction);
  },
  async denyFn({ interaction, t }) {
    await interaction.update({ components: [], content: t('reset.cancelled') });
  },
});
