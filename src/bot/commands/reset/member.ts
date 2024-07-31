import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
} from 'discord.js';
import resetModel from '../../models/resetModel.js';
import { ParserResponseStatus, parseMember } from '../../util/parser.js';
import { subcommand } from 'bot/util/registry/command.js';
import { useConfirm } from 'bot/util/component.js';
import { requireUser } from 'bot/util/predicates.js';

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
      },
      {
        name: 'id',
        description: 'The ID of the member to reset.',
        type: ApplicationCommandOptionType.String,
        min_length: 17,
        max_length: 20,
      },
    ],
  },
  async execute({ interaction }) {
    if (
      !interaction.member.permissionsIn(interaction.channel!).has(PermissionFlagsBits.ManageGuild)
    ) {
      await interaction.reply({
        content: 'You need the permission to manage the server in order to use this command.',
        ephemeral: true,
      });
      return;
    }

    const resolvedMember = parseMember(interaction);
    if (resolvedMember.status === ParserResponseStatus.ConflictingInputs) {
      await interaction.reply({
        content: `You have specified both a member and an ID, but they don't match.\nDid you mean: "/reset member member:${interaction.options.get('member')!.value}"?`,
        ephemeral: true,
      });
      return;
    } else if (resolvedMember.status === ParserResponseStatus.NoInput) {
      await interaction.reply({
        content: "You need to specify either a member or a member's ID!",
        ephemeral: true,
      });
      return;
    }

    const predicate = requireUser(interaction.user);
    const confirmRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(
          confirmButton.instanceId({
            data: { initialInteraction: interaction, targetId: resolvedMember.id },
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

    const targetDisplay = resolvedMember.object
      ? resolvedMember.object.user.username
      : `Deleted [${resolvedMember.id}]`;

    await interaction.reply({
      content: `Are you sure you want to reset all the statistics of ${targetDisplay}?`,
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
      type: 'guildMembersStats',
      ref: data.initialInteraction,
      cmdChannel: data.initialInteraction.channel!,
      userIds: [data.targetId],
    };
    await interaction.update({ components: [], content: 'Resetting, please wait...' });
  },
  async denyFn({ interaction }) {
    await interaction.update({ components: [], content: 'Reset cancelled.' });
  },
});
