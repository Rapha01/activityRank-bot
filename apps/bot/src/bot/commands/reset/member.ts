import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type ChatInputCommandInteraction,
  PermissionFlagsBits,
} from 'discord.js';
import { command } from '#bot/commands.js';
import { ResetGuildMembersStatisticsAndXp } from '#bot/models/resetModel.js';
import { useConfirm } from '#bot/util/component.js';
import { requireUser } from '#bot/util/predicates.js';

export default command({
  name: 'reset member',
  async execute({ interaction, options, t }) {
    if (
      interaction.channel &&
      !interaction.member.permissionsIn(interaction.channel).has(PermissionFlagsBits.ManageGuild)
    ) {
      await interaction.reply({ content: t('missing.manageServer'), ephemeral: true });
      return;
    }

    const user = options.member;

    const predicate = requireUser(interaction.user);
    const confirmRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(
          confirmButton.instanceId({
            data: { initialInteraction: interaction, targetId: user.id },
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

    await interaction.reply({
      content: t('reset.user', { user: user.toString() }),
      ephemeral: true,
      components: [confirmRow],
    });
  },
});

const { confirmButton, denyButton } = useConfirm<{
  initialInteraction: ChatInputCommandInteraction<'cached'>;
  targetId: string;
}>({
  async confirmFn({ interaction, data, t }) {
    const job = new ResetGuildMembersStatisticsAndXp(interaction.guild, [data.targetId]);

    await interaction.update({ content: t('reset.preparing'), components: [] });

    await job.plan();
    await job.logStatus(interaction);

    await job.runUntilComplete({
      onPause: async () => await job.logStatus(interaction),
      globalBufferTime: 100,
      jobBufferTime: 3000,
    });
    await job.logStatus(interaction);
  },
  async denyFn({ interaction, t }) {
    await interaction.update({ components: [], content: t('reset.cancelled') });
  },
});
