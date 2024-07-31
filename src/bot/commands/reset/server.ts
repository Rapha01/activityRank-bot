import cooldownUtil from '../../util/cooldownUtil.js';
import resetModel from '../../models/resetModel.js';
import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  type ButtonInteraction,
  type ChatInputCommandInteraction,
} from 'discord.js';
import { getGuildModel } from 'bot/models/guild/guildModel.js';
import { subcommand } from 'bot/util/registry/command.js';
import { useConfirm } from 'bot/util/component.js';
import type { Writeable } from 'bot/util/typescript.js';
import { requireUser } from 'bot/util/predicates.js';

const choices = [
  { name: 'Stats & Settings', value: 'all' },
  { name: 'All Statistics', value: 'stats' },
  { name: 'All Server Settings', value: 'settings' },
  { name: 'Text XP', value: 'textstats' },
  { name: 'Voice XP', value: 'voicestats' },
  { name: 'Invite XP', value: 'invitestats' },
  { name: 'Upvote XP', value: 'votestats' },
  { name: 'Bonus XP', value: 'bonusstats' },
  { name: 'Members no longer in the server', value: 'deletedmembers' },
  { name: 'Deleted channels', value: 'deletedchannels' },
  { name: 'Cancel Active Resets', value: 'stop' },
] as const;

type ResetType = (typeof choices)[number]['value'];

export const server = subcommand({
  data: {
    name: 'server',
    description: 'Reset server statistics.',
    type: ApplicationCommandOptionType.Subcommand,
    options: [
      {
        name: 'type',
        description: 'The type of reset to execute.',
        type: ApplicationCommandOptionType.String,
        choices: choices as Writeable<typeof choices>,
        required: true,
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

    const field = interaction.options.getString('type', true) as ResetType;
    if (field == 'stop') {
      delete resetModel.resetJobs[interaction.guild.id];

      await interaction.reply({ content: 'Stopped reset.', ephemeral: true });
      return;
    }

    if (!(await cooldownUtil.checkResetServerCommandCooldown(interaction))) return;

    const predicate = requireUser(interaction.user);
    const confirmRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(
          confirmButton.instanceId({ data: { field, initialInteraction: interaction }, predicate }),
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
      content: 'Are you sure you want to reset these statistics?',
      ephemeral: true,
      components: [confirmRow],
    });
  },
});

const { confirmButton, denyButton } = useConfirm<{
  field: ResetType;
  initialInteraction: ChatInputCommandInteraction<'cached'>;
}>({
  async confirmFn({ interaction, data }) {
    await interaction.update({ components: [] });
    await runReset(interaction, data.field, data.initialInteraction);
  },
  async denyFn({ interaction }) {
    await interaction.update({ components: [], content: 'Reset cancelled.' });
  },
});

async function runReset(
  interaction: ButtonInteraction<'cached'>,
  field: ResetType,
  initialInteraction: ChatInputCommandInteraction<'cached'>,
) {
  if (field == 'deletedmembers') {
    const userIds = await resetModel.storage.getDeletedUserIds(initialInteraction.guild);

    resetModel.resetJobs[initialInteraction.guild.id] = {
      type: 'guildMembersStats',
      ref: initialInteraction,
      cmdChannel: initialInteraction.channel!,
      userIds: userIds,
    };
    await interaction.followUp({
      content: 'Resetting, please wait...',
      ephemeral: true,
    });
  } else if (field == 'deletedchannels') {
    const channelIds = await resetModel.storage.getDeletedChannelIds(initialInteraction.guild);

    resetModel.resetJobs[initialInteraction.guild.id] = {
      type: 'guildChannelsStats',
      ref: initialInteraction,
      cmdChannel: initialInteraction.channel!,
      channelIds: channelIds,
    };
    await interaction.followUp({
      content: 'Resetting, please wait...',
      ephemeral: true,
    });
  } else if (
    field == 'all' ||
    field == 'stats' ||
    field == 'settings' ||
    field == 'textstats' ||
    field == 'voicestats' ||
    field == 'invitestats' ||
    field == 'votestats' ||
    field == 'bonusstats'
  ) {
    resetModel.resetJobs[initialInteraction.guild.id] = {
      type: field,
      ref: initialInteraction,
      cmdChannel: initialInteraction.channel!,
    };
    await interaction.followUp({
      content: 'Resetting, please wait...',
      ephemeral: true,
    });
  } else {
    console.warn(`[/reset server] Invalid field ${field}`);
  }
  const cachedGuild = await getGuildModel(initialInteraction.guild);
  cachedGuild.cache.lastResetServer = new Date();
}
