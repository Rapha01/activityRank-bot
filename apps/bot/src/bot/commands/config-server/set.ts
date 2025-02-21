import {
  ButtonStyle,
  PermissionFlagsBits,
  ComponentType,
  type Interaction,
  type ButtonComponentData,
  type ActionRowData,
  type APIEmbed,
} from 'discord.js';
import { stripIndent } from 'common-tags';
import { getGuildModel } from '../../models/guild/guildModel.js';
import { command } from '#bot/commands.js';
import { closeButton } from '#bot/util/component.js';
import { requireUser } from '#bot/util/predicates.js';
import { component } from '#bot/util/registry/component.js';
import type { TFunction } from 'i18next';

type BooleanGuildKey =
  | 'showNicknames'
  | 'reactionVote'
  | 'allowMutedXp'
  | 'allowDeafenedXp'
  | 'allowSoloXp'
  | 'takeAwayAssignedRolesOnLevelDown'
  | 'notifyLevelupDm'
  | 'notifyLevelupCurrentChannel'
  | 'notifyLevelupWithRole'
  | 'textXp'
  | 'voiceXp'
  | 'inviteXp'
  | 'voteXp'
  | 'resetDeletedMembers'
  | 'stickyLevelRoles';

const generateRows = async (
  t: TFunction<'command-content'>,
  interaction: Interaction<'cached'>,
): Promise<ActionRowData<ButtonComponentData>[]> => {
  const cachedGuild = await getGuildModel(interaction.guild);
  const rows: {
    label?: string;
    emoji?: string;
    key: BooleanGuildKey;
  }[][] = [
    [
      { label: t('config-server.useNickname'), key: 'showNicknames' },
      { label: t('config-server.reactVote'), key: 'reactionVote' },
      { label: t('config-server.mutedXP'), key: 'allowMutedXp' },
      { label: t('config-server.deafenedXP'), key: 'allowDeafenedXp' },
      { label: t('config-server.soloXP'), key: 'allowSoloXp' },
    ],
    [
      { label: t('config-server.TAAROLDshort'), key: 'takeAwayAssignedRolesOnLevelDown' },
      { label: t('config-server.notifyDM'), key: 'notifyLevelupDm' },
      { label: t('config-server.lastChannel'), key: 'notifyLevelupCurrentChannel' },
      { label: t('config-server.includeLVLup'), key: 'notifyLevelupWithRole' },
    ],
    [
      { emoji: '✍️', key: 'textXp' },
      { emoji: '🎙️', key: 'voiceXp' },
      { emoji: '✉️', key: 'inviteXp' },
      { emoji: '❤️', key: 'voteXp' },
    ],
    [
      { label: t('config-server.reset'), key: 'resetDeletedMembers' },
      { label: t('config-server.stickyRoles'), key: 'stickyLevelRoles' },
    ],
  ];

  const items = rows.map((group) =>
    group.map(
      (item): ButtonComponentData => ({
        type: ComponentType.Button,
        style: cachedGuild.db[item.key] === 1 ? ButtonStyle.Success : ButtonStyle.Danger,
        label: item.label,
        emoji: item.emoji,
        customId: setButton.instanceId({
          data: { key: item.key },
          predicate: requireUser(interaction.user),
        }),
      }),
    ),
  );

  // special cases
  if (cachedGuild.db.notifyLevelupCurrentChannel) {
    items[1][1].disabled = true;
    items[1][1].style = ButtonStyle.Danger;
  }

  if (Number.parseInt(cachedGuild.db.autopost_levelup)) {
    items[1][1].disabled = true;
    items[1][1].style = ButtonStyle.Danger;
    items[1][2].disabled = true;
    items[1][2].style = ButtonStyle.Danger;
  }

  return [
    ...items.map((row) => ({ type: ComponentType.ActionRow, components: row })),
    {
      type: ComponentType.ActionRow,
      components: [
        {
          type: ComponentType.Button,
          style: ButtonStyle.Danger,
          label: t('config-server.close'),
          customId: closeButton.instanceId({ predicate: requireUser(interaction.user) }),
        },
      ],
    },
  ];
};

export default command({
  name: 'config-server set',
  async execute({ interaction, t }) {
    if (
      interaction.channel &&
      !interaction.member.permissionsIn(interaction.channel).has(PermissionFlagsBits.ManageGuild)
    ) {
      await interaction.reply({ content: t('missing.manageServer'), ephemeral: true });
      return;
    }

    const cachedGuild = await getGuildModel(interaction.guild);

    const embed: APIEmbed = {
      author: { name: 'Server Settings' },
      color: 0x00ae86,
      fields: [
        { name: t('config-server.useNickname'), value: t('config-server.useNicknameDescription') },
        {
          name: t('config-server.reactVote'),
          value: t('config-server.reactVoteDescription', { value: cachedGuild.db.voteEmote }),
        },
        { name: t('config-server.mutedXP'), value: t('config-server.mutedXPDescription') },
        { name: t('config-server.deafenedXP'), value: t('config-server.deafenedXPDescription') },
        { name: t('config-server.soloXP'), value: t('config-server.soloXPDescription') },
        { name: t('config-server.TAAROLDfull'), value: t('config-server.TAAROLDDescription') },
        { name: t('config-server.notifyDM'), value: t('config-server.notifyDMDescription') },
        { name: t('config-server.lastChannel'), value: t('config-server.lastChannelDescription') },
        {
          name: t('config-server.includeLVLup'),
          value: t('config-server.includeLVLupDescription'),
        },
        { name: '✍️, 🎙️, ✉️, ❤️', value: t('config-server.emojiDescription') },
        { name: t('config-server.reset'), value: t('config-server.resetDescription') },
        { name: t('config-server.stickyRoles'), value: t('config-server.stickyRolesDescription') },
      ],
    };

    await interaction.reply({
      embeds: [embed],
      components: await generateRows(t, interaction),
    });
  },
});

const setButton = component<{ key: BooleanGuildKey }>({
  type: ComponentType.Button,
  async callback({ interaction, data, t }) {
    const cachedGuild = await getGuildModel(interaction.guild);

    if (cachedGuild.db[data.key]) await cachedGuild.upsert({ [data.key]: 0 });
    else await cachedGuild.upsert({ [data.key]: 1 });

    await interaction.update({ components: await generateRows(t, interaction) });
  },
});
