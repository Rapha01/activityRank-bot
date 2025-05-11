import type { ShardDB } from '@activityrank/database';
import {
  ActionRowBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
  ComponentType,
  type Interaction,
} from 'discord.js';
import guildChannelModel from '../models/guild/guildChannelModel.js';
import { getGuildModel, type GuildModel } from '../models/guild/guildModel.js';
import nameUtil from '../util/nameUtil.js';
import { ParserResponseStatus, parseChannel } from '../util/parser.js';
import { command } from '#bot/commands.js';
import { component } from '#bot/util/registry/component.js';
import { requireUser, requireUserId } from '#bot/util/predicates.js';
import { closeButton } from '#bot/util/component.js';
import type { TFunction } from 'i18next';

type Setting = 'noXp' | 'autopost_serverJoin' | 'autopost_levelup';

const settingButton = component<{
  channelId: string;
  type: ChannelType | null;
  setting: Setting;
}>({
  type: ComponentType.Button,
  async callback({ interaction, data, t }) {
    const { channelId, type, setting } = data;

    let myChannel = await guildChannelModel.storage.get(interaction.guild, channelId);

    const cachedGuild = await getGuildModel(interaction.guild);

    if (setting === 'noXp') {
      if (myChannel.noXp)
        await guildChannelModel.storage.set(interaction.guild, channelId, 'noXp', 0);
      else await guildChannelModel.storage.set(interaction.guild, channelId, 'noXp', 1);

      myChannel = await guildChannelModel.storage.get(interaction.guild, channelId);
    } else {
      if (cachedGuild.db[setting] === channelId) await cachedGuild.upsert({ [setting]: '0' });
      else await cachedGuild.upsert({ [setting]: channelId });
    }

    await interaction.update({
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          generateRow(t, interaction, channelId, type, cachedGuild, myChannel),
        ),
        _close(interaction.user.id),
      ],
    });
  },
});

const generateRow = (
  t: TFunction<'command-content'>,
  interaction: Interaction<'cached'>,
  channelId: string,
  type: ChannelType | null,
  myGuild: GuildModel,
  myChannel: ShardDB.GuildChannel,
) => {
  const r = [
    new ButtonBuilder().setLabel(t('config-channel.noXP')),
    new ButtonBuilder().setLabel(t('config-channel.joinChannel')),
    new ButtonBuilder().setLabel(t('config-channel.levelupChannel')),
  ];

  function disableIfNotAutosendable(builder: ButtonBuilder) {
    if (!AUTOSENDABLE_CHANNEL_TYPES.includes(type)) {
      builder.setDisabled(true);
      builder.setStyle(ButtonStyle.Secondary);
    }
  }

  function getStyleFromEquivalence(check?: string) {
    return check === channelId ? ButtonStyle.Success : ButtonStyle.Danger;
  }

  const getButton = (setting: Setting) =>
    settingButton.instanceId({
      data: { channelId, type, setting },
      predicate: requireUser(interaction.user),
    });

  r[0].setCustomId(getButton('noXp'));
  r[0].setStyle(myChannel.noXp ? ButtonStyle.Success : ButtonStyle.Danger);

  r[1].setCustomId(getButton('autopost_serverJoin'));
  r[1].setStyle(getStyleFromEquivalence(myGuild.db.autopost_serverJoin));

  r[2].setCustomId(getButton('autopost_levelup'));
  r[2].setStyle(getStyleFromEquivalence(myGuild.db.autopost_levelup));

  disableIfNotText(r[1]);
  disableIfNotText(r[2]);

  return r;
};

const _close = (ownerId: string) =>
  new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel('Close')
      .setStyle(ButtonStyle.Danger)
      .setCustomId(closeButton.instanceId({ predicate: requireUserId(ownerId) })),
  );

const AUTOSENDABLE_CHANNEL_TYPES: (ChannelType | null)[] = [
  ChannelType.GuildText,
  ChannelType.GuildAnnouncement,
];

export default command({
  name: 'config-channel',
  async execute({ interaction, t }) {
    const resolvedChannel = parseChannel(interaction);
    if (resolvedChannel.status === ParserResponseStatus.ConflictingInputs) {
      await interaction.reply({
        content: t('config-channel.conflict', {
          value: interaction.options.get('channel', true).value,
        }),
        ephemeral: true,
      });
      return;
    }
    if (resolvedChannel.status === ParserResponseStatus.NoInput) {
      await interaction.reply({ content: t('config-channel.notSpecified'), ephemeral: true });
      return;
    }

    if (
      interaction.channel &&
      !interaction.member.permissionsIn(interaction.channel).has(PermissionFlagsBits.ManageGuild)
    ) {
      await interaction.reply({
        content: t('missing.manageServer'),
        ephemeral: true,
      });
      return;
    }

    const myChannel = await guildChannelModel.storage.get(interaction.guild, resolvedChannel.id);

    const embed = new EmbedBuilder()
      .setAuthor({ name: t('config-channel.channelSettings') })
      .setDescription(
        nameUtil.getChannelMention(interaction.guild.channels.cache, resolvedChannel.id),
      )
      .setColor(0x00ae86)
      .addFields({ name: t('config-channel.noXP'), value: t('config-channel.noXPDescription') });

    if (
      !resolvedChannel.object ||
      AUTOSENDABLE_CHANNEL_TYPES.includes(resolvedChannel.object.type)
    ) {
      embed.addFields(
        {
          name: t('config-channel.joinChannel'),
          value: t('config-channel.joinChannelDescription'),
        },
        {
          name: t('config-channel.levelupChannel'),
          value: t('config-channel.levelupChannelDescription'),
        },
      );
    }

    const cachedGuild = await getGuildModel(interaction.guild);

    await interaction.reply({
      embeds: [embed],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          generateRow(
            t,
            interaction,
            resolvedChannel.id,
            resolvedChannel.object ? resolvedChannel.object.type : null,
            cachedGuild,
            myChannel,
          ),
        ),
        _close(interaction.user.id),
      ],
    });
  },
});
