import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonStyle,
  type ChatInputCommandInteraction,
  PermissionFlagsBits,
} from 'discord.js';
import { subcommand } from '#bot/commands.js';
import { useConfirm } from '#bot/util/component.js';
import { requireUser } from '#bot/util/predicates.js';
import { ResetGuildMembersStatisticsAndXp } from '#bot/models/resetModel.js';

export const member = subcommand({
  data: {
    name: 'member',
    description: "Reset a member's statistics.",
    type: ApplicationCommandOptionType.Subcommand,
    options: [
      {
        name: 'member',
        description: 'The member to reset.',
        type: ApplicationCommandOptionType.User,
        required: true,
      },
    ],
  },
  async execute({ interaction }) {
    if (
      interaction.channel &&
      !interaction.member.permissionsIn(interaction.channel).has(PermissionFlagsBits.ManageGuild)
    ) {
      await interaction.reply({
        content: 'You need the permission to manage the server in order to use this command.',
        ephemeral: true,
      });
      return;
    }

    const user = interaction.options.getUser('member', true);

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
      content: `Are you sure you want to reset all the statistics and XP of ${user}?`,
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
    const job = new ResetGuildMembersStatisticsAndXp(interaction.guild, [data.targetId]);

    await interaction.update({ content: 'Preparing to reset. Please wait...', components: [] });

    await job.plan();
    await job.logStatus(interaction);

    await job.runUntilComplete({
      onPause: async () => await job.logStatus(interaction),
      globalBufferTime: 100,
      jobBufferTime: 3000,
    });
    await job.logStatus(interaction);
  },
  async denyFn({ interaction }) {
    await interaction.update({ components: [], content: 'Reset cancelled.' });
  },
});
