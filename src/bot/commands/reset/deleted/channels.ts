import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} from 'discord.js';
import { subcommand } from 'bot/util/registry/command.js';
import { useConfirm } from 'bot/util/component.js';
import { requireUser } from 'bot/util/predicates.js';
import { fetchDeletedChannelIds, ResetGuildChannelsStatistics } from 'bot/models/resetModel.js';

export const channels = subcommand({
  data: {
    name: 'channels',
    description: 'Reset the statistics of all deleted channels.',
    type: ApplicationCommandOptionType.Subcommand,
  },
  async execute({ interaction }) {
    // TODO deprecate in favour of native Discord slash command permissions
    if (
      !interaction.channel ||
      !interaction.member.permissionsIn(interaction.channel).has(PermissionFlagsBits.ManageGuild)
    ) {
      await interaction.reply({
        content: 'You need the permission to manage the server in order to use this command.',
        ephemeral: true,
      });
      return;
    }
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
    await job.logStatus(interaction);
  },
  async denyFn({ interaction }) {
    await interaction.update({ components: [], content: 'Reset cancelled.' });
  },
});
