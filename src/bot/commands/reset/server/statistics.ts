import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  PermissionFlagsBits,
} from 'discord.js';
import { subcommand } from 'bot/util/registry/command.js';
import { actionrow, useConfirm } from 'bot/util/component.js';
import { requireUser } from 'bot/util/predicates.js';
import { ResetGuildStatisticsAndXP } from 'bot/models/resetModel.js';
import cooldownUtil from 'bot/util/cooldownUtil.js';
import { getGuildModel } from 'bot/models/guild/guildModel.js';
import { component } from 'bot/util/registry/component.js';
import { commaListsAnd } from 'common-tags';

type Table = 'textMessage' | 'voiceMinute' | 'vote' | 'invite' | 'bonus';

export const statistics = subcommand({
  data: {
    name: 'statistics',
    description: 'Reset one or more types of statistic for the entire server.',
    type: ApplicationCommandOptionType.Subcommand,
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

    if (!(await cooldownUtil.checkResetServerCommandCooldown(interaction))) return;

    const predicate = requireUser(interaction.user);

    const cachedGuild = await getGuildModel(interaction.guild);

    const typesRow = actionrow([
      {
        type: ComponentType.StringSelect,
        customId: xpTypeselect.instanceId({ predicate }),
        options: [
          {
            label: 'Messages',
            value: 'textMessage',
            emoji: '✍️',
          },
          {
            label: 'Voice Time',
            value: 'voiceMinute',
            emoji: '🎙️',
          },
          {
            label: 'Votes',
            value: 'vote',
            emoji: cachedGuild.db.voteEmote,
          },
          {
            label: 'Invites',
            value: 'invite',
            emoji: '✉️',
          },
        ] satisfies { value: Table; [k: string]: unknown }[],
        maxValues: 4,
        minValues: 1,
        placeholder: 'Select XP types to reset.',
      },
    ]);

    await interaction.reply({
      content: 'Which types of XP would you like to reset?',
      ephemeral: true,
      components: [typesRow],
    });
  },
});

const xpTypeselect = component({
  type: ComponentType.StringSelect,
  async callback({ interaction }) {
    const predicate = requireUser(interaction.user);
    const values = interaction.values as Table[];

    const confirmRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(confirmButton.instanceId({ predicate, data: { tables: values } }))
        .setLabel('Reset')
        .setEmoji('✅')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(denyButton.instanceId({ predicate }))
        .setLabel('Cancel')
        .setEmoji('❎')
        .setStyle(ButtonStyle.Secondary),
    );

    const prettify: Record<string, string> = {
      textMessage: 'text',
      voiceMinute: 'voice',
      vote: 'vote',
      invite: 'invite',
    };

    await interaction.reply({
      content: commaListsAnd`Are you sure you want to reset all the **${values.map((v) => prettify[v])}** statistics?\n\n**This will also reset all XP associated with those statistics. This cannot be undone.**`,
      ephemeral: true,
      components: [confirmRow],
    });
  },
});

const { confirmButton, denyButton } = useConfirm<{ tables: Table[] }>({
  async confirmFn({ interaction, data }) {
    const job = new ResetGuildStatisticsAndXP(interaction.guild, data.tables);

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
