import {
  ButtonStyle,
  EmbedBuilder,
  PermissionFlagsBits,
  ComponentType,
  type Interaction,
  type ButtonComponentData,
  type ActionRowData,
} from 'discord.js';

import { stripIndent } from 'common-tags';
import guildModel from '../../models/guild/guildModel.js';
import { registerComponent, registerSubCommand } from 'bot/util/commandLoader.js';
import type { GuildSchema } from 'models/types/shard.js';
import type { PropertiesOfType } from 'models/types/generics.js';

const generateRows = async (
  interaction: Interaction<'cached'>,
): Promise<ActionRowData<ButtonComponentData>[]> => {
  // TODO: test this
  const myGuild = await guildModel.storage.get(interaction.guild);
  const rows: {
    label?: string;
    emoji?: string;
    key: keyof PropertiesOfType<GuildSchema, number>;
  }[][] = [
    [
      { label: 'Use Nicknames', key: 'showNicknames' },
      { label: 'Reaction Voting', key: 'reactionVote' },
      { label: 'Allow Muted XP', key: 'allowMutedXp' },
      { label: 'Allow Deafened XP', key: 'allowDeafenedXp' },
      { label: 'Allow Solo XP', key: 'allowSoloXp' },
    ],
    [
      { label: 'TAAROLD', key: 'takeAwayAssignedRolesOnLevelDown' },
      { label: 'Notify Via DM', key: 'notifyLevelupDm' },
      { label: 'Notify in Last Active Channel', key: 'notifyLevelupCurrentChannel' },
      { label: 'Include Levelup Message', key: 'notifyLevelupWithRole' },
    ],
    [
      { emoji: '✍️', key: 'textXp' },
      { emoji: '🎙️', key: 'voiceXp' },
      { emoji: '✉️', key: 'inviteXp' },
      { emoji: '❤️', key: 'voteXp' },
    ],
  ];
  /* const r1 = [
    new ButtonBuilder()
      .setLabel('Use Nicknames')
      .setCustomId(`config-server/set ${i.member.id} showNicknames`),
    new ButtonBuilder()
      .setLabel('Reaction Voting')
      .setCustomId(`config-server/set ${i.member.id} reactionVote`),
    new ButtonBuilder()
      .setLabel('Allow Muted XP')
      .setCustomId(`config-server/set ${i.member.id} allowMutedXp`),
    new ButtonBuilder()
      .setLabel('Allow Deafened XP')
      .setCustomId(`config-server/set ${i.member.id} allowDeafenedXp`),
    new ButtonBuilder()
      .setLabel('Allow Solo XP')
      .setCustomId(`config-server/set ${i.member.id} allowSoloXp`),
  ];
  const r2 = [
    new ButtonBuilder()
      .setLabel('TAAROLD')
      .setCustomId(`config-server/set ${i.member.id} takeAwayAssignedRolesOnLevelDown`),
    new ButtonBuilder()
      .setLabel('Notify Via DM')
      .setCustomId(`config-server/set ${i.member.id} notifyLevelupDm`),
    new ButtonBuilder()
      .setLabel('Notify in Last Active Channel')
      .setCustomId(`config-server/set ${i.member.id} notifyLevelupCurrentChannel`),
    new ButtonBuilder()
      .setLabel('Include Levelup Message')
      .setCustomId(`config-server/set ${i.member.id} notifyLevelupWithRole`),
  ];
  const r3 = [
    new ButtonBuilder().setEmoji('✍️').setCustomId(`config-server/set ${i.member.id} textXp`),
    new ButtonBuilder().setEmoji('🎙️').setCustomId(`config-server/set ${i.member.id} voiceXp`),
    new ButtonBuilder().setEmoji('✉️').setCustomId(`config-server/set ${i.member.id} inviteXp`),
    new ButtonBuilder().setEmoji('❤️').setCustomId(`config-server/set ${i.member.id} voteXp`),
  ];
  r1.forEach((o) =>
    o.setStyle(
      myGuild[o.data.custom_id.split(' ')[2]] === 1 ? ButtonStyle.Success : ButtonStyle.Danger,
    ),
  );
  r2.forEach((o) =>
    o.setStyle(
      myGuild[o.data.custom_id.split(' ')[2]] === 1 ? ButtonStyle.Success : ButtonStyle.Danger,
    ),
  );
  r3.forEach((o) =>
    o.setStyle(
      myGuild[o.data.custom_id.split(' ')[2]] === 1 ? ButtonStyle.Success : ButtonStyle.Danger,
    ),
  ); */

  const items = rows.map((group) =>
    group.map(
      (item): ButtonComponentData => ({
        type: ComponentType.Button,
        style: myGuild![item.key] === 1 ? ButtonStyle.Success : ButtonStyle.Danger,
        label: item.label,
        emoji: item.emoji,
        customId: setId({ key: item.key }, { ownerId: interaction.user.id }),
      }),
    ),
  );

  // special cases
  if (myGuild!.notifyLevelupCurrentChannel) {
    items[1][1].disabled = true;
    items[1][1].style = ButtonStyle.Danger;
  }

  if (parseInt(myGuild!.autopost_levelup)) {
    items[1][1].disabled = true;
    items[1][1].style = ButtonStyle.Danger;
    items[1][2].disabled = true;
    items[1][2].style = ButtonStyle.Danger;
  }

  return [
    ...items.map(
      (row): ActionRowData<ButtonComponentData> => ({
        type: ComponentType.ActionRow,
        components: row,
      }),
    ),
    {
      type: ComponentType.ActionRow,
      components: [
        {
          type: ComponentType.Button,
          style: ButtonStyle.Danger,
          label: 'Close',
          customId: closeId(null, { ownerId: interaction.user.id }),
        },
      ],
    },
  ];

  /* if (myGuild.notifyLevelupCurrentChannel) r2[1].setDisabled(true).setStyle(ButtonStyle.Danger);
  if (parseInt(myGuild.autopost_levelup)) {
    r2[1].setDisabled(true).setStyle(ButtonStyle.Danger);
    r2[2].setDisabled(true).setStyle(ButtonStyle.Danger);
  }
  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(r1),
    new ActionRowBuilder<ButtonBuilder>().addComponents(r2),
    new ActionRowBuilder<ButtonBuilder>().addComponents(r3),
    _close(i),
  ]; */
};

registerSubCommand({
  async execute(interaction) {
    if (
      !interaction.member.permissionsIn(interaction.channel!).has(PermissionFlagsBits.ManageGuild)
    ) {
      return await interaction.reply({
        content: 'You need the permission to manage the server in order to use this command.',
        ephemeral: true,
      });
    }

    const cachedGuild = await guildModel.cache.get(interaction.guild);

    const embed = new EmbedBuilder()
      .setAuthor({ name: 'Server Settings' })
      .setColor(0x00ae86)
      .addFields(
        {
          name: 'Use Nicknames',
          value:
            'If this is enabled, nicknames will be used to represent members instead of their Discord usernames',
        },
        {
          name: 'Reaction Voting',
          value: `If this is enabled, members will be permitted to vote using the server's voteEmote, ${cachedGuild.db.voteEmote}`,
        },
        {
          name: 'Allow Muted XP',
          value:
            'If this is enabled, members will be permitted to gain XP in VCs, even when they are muted.',
        },
        {
          name: 'Allow Deafened XP',
          value:
            'If this is enabled, members will be permitted to gain XP in VCs, even when they are deafened.',
        },
        {
          name: 'Allow Solo XP',
          value:
            'If this is enabled, members will be permitted to gain XP in VCs, even when they are alone. Bots do not count.',
        },
        {
          name: 'TAAROLD (Take Away Assigned Roles On Level Down)',
          value:
            'If this is enabled, the bot will remove roles when the member falls below their assignLevel.',
        },
        {
          name: 'Notify Via DM',
          value: stripIndent`
          If this is enabled, the bot will allow members to recieve levelup notifications via DM.
          You cannot select this if either of the below two options are enabled, because they will take priority.`,
        },
        {
          name: 'Notify in Last Active Channel',
          value: stripIndent`
          If this is enabled, the bot will notify members of their levelups in their last used text channel.
          You cannot select this if the below option is enabled, because it will take priority.`,
        },
        {
          name: 'Include Levelup Message',
          value: stripIndent`
          If this is enabled, when a role has a custom roleAssign message, the bot will also send the default levelup message.
          Otherwise, it will only send the roleAssign message.`,
        },
        {
          name: '✍️, 🎙️, ✉️, ❤️',
          value: stripIndent`
          These will enable or disable text, voice, invite, and upvoteXP respectively.
          You may want to reset these categories, as disabling them will only hide them and prevent more from being added.`,
        },
      );

    await interaction.reply({
      embeds: [embed],
      components: await generateRows(interaction),
    });
  },
});

const setId = registerComponent<{ key: keyof PropertiesOfType<GuildSchema, number> }>({
  identifier: 'config-server.set',
  type: ComponentType.Button,
  async callback({ interaction, data }) {
    const myGuild = await guildModel.storage.get(interaction.guild);

    if (myGuild![data.key]) await guildModel.storage.set(interaction.guild, data.key, 0);
    else await guildModel.storage.set(interaction.guild, data.key, 1);

    await interaction.update({ components: await generateRows(interaction) });
  },
});

const closeId = registerComponent({
  identifier: 'config-server.close',
  type: ComponentType.Button,
  async callback({ interaction }) {
    await interaction.deferUpdate();
    await interaction.deleteReply();
  },
});
