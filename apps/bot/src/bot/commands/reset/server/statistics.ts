import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  PermissionFlagsBits,
} from 'discord.js';
import { command } from '#bot/commands.js';
import { actionrow, useConfirm } from '#bot/util/component.js';
import { requireUser } from '#bot/util/predicates.js';
import { ResetGuildStatistics } from '#bot/models/resetModel.js';
import { handleResetCommandsCooldown } from '#bot/util/cooldownUtil.js';
import { component } from '#bot/util/registry/component.js';

type Table = 'textMessage' | 'voiceMinute' | 'vote' | 'invite' | 'bonus';

export default command({
  name: 'reset server statistics',
  async execute({ interaction, t }) {
    if (
      interaction.channel &&
      !interaction.member.permissionsIn(interaction.channel).has(PermissionFlagsBits.ManageGuild)
    ) {
      await interaction.reply({ content: t('missing.manageServer'), ephemeral: true });
      return;
    }

    if ((await handleResetCommandsCooldown(interaction)).denied) return;

    const predicate = requireUser(interaction.user);

    const typesRow = actionrow([
      {
        type: ComponentType.StringSelect,
        customId: xpTypeselect.instanceId({ predicate }),
        options: [
          {
            label: t('reset.server.messages'),
            value: 'textMessage',
            emoji: { name: '✍️' },
          },
          {
            label: t('reset.server.voicetime'),
            value: 'voiceMinute',
            emoji: { name: '🎙️' },
          },
          {
            label: t('reset.server.votes'),
            value: 'vote',
            // TODO: emoji: cachedGuild.db.voteEmote,
            emoji: { name: '❤️' },
          },
          {
            label: t('reset.server.invites'),
            value: 'invite',
            emoji: { name: '✉️' },
          },
          {
            label: t('reset.server.bonus'),
            value: 'bonus',
            emoji: { name: '⭐' },
          },
        ] satisfies { value: Table; [k: string]: unknown }[],
        maxValues: 5,
        minValues: 1,
        placeholder: 'Select XP types to reset.',
      },
    ]);

    await interaction.reply({
      content: t('reset.server.type'),
      ephemeral: true,
      components: [typesRow],
    });
  },
});

const xpTypeselect = component({
  type: ComponentType.StringSelect,
  async callback({ interaction, t }) {
    const predicate = requireUser(interaction.user);
    const values = interaction.values as Table[];

    const confirmRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(confirmButton.instanceId({ predicate, data: { tables: values } }))
        .setLabel(t('reset.server.reset'))
        .setEmoji('✅')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(denyButton.instanceId({ predicate }))
        .setLabel(t('reset.server.cancel'))
        .setEmoji('❎')
        .setStyle(ButtonStyle.Secondary),
    );

    const prettify = (key: Table): string => t(`reset.server.table.${key}`);

    const explanation = values.includes('bonus')
      ? values.length > 1
        ? t('reset.server.explainBonus')
        : t('reset.server.explainBonusAndStats')
      : t('reset.server.explainStats');

    await interaction.reply({
      content: t('reset.server.confirmationStats', {
        values: values.map((v) => prettify(v)),
        explanation,
      }),
      ephemeral: true,
      components: [confirmRow],
    });
  },
});

const { confirmButton, denyButton } = useConfirm<{ tables: Table[] }>({
  async confirmFn({ interaction, data, t }) {
    const job = new ResetGuildStatistics(interaction.guild, data.tables);

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
