import { ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';
import { command } from '#bot/commands.js';
import { ResetGuildSettings } from '#bot/models/resetModel.js';
import { useConfirm } from '#bot/util/component.js';
import { handleResetCommandsCooldown } from '#bot/util/cooldownUtil.js';
import { requireUser } from '#bot/util/predicates.js';

export default command({
  name: 'reset server settings',
  async execute({ interaction, t }) {
    if (
      interaction.channel &&
      !interaction.member.permissionsIn(interaction.channel).has(PermissionFlagsBits.ManageGuild)
    ) {
      await interaction.reply({ content: t('missing.manageServer'), ephemeral: true });
      return;
    }

    if ((await handleResetCommandsCooldown(t, interaction)).denied) return;

    const predicate = requireUser(interaction.user);
    const confirmRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(confirmButton.instanceId({ predicate }))
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
      content: t('reset.server.confirmationSettings'),
      ephemeral: true,
      components: [confirmRow],
    });
  },
});

const { confirmButton, denyButton } = useConfirm({
  async confirmFn({ interaction, t }) {
    const job = new ResetGuildSettings(interaction.guild);

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
