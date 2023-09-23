import {
  SlashCommandBuilder,
  ActionRowBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
  ComponentType,
  type Interaction,
} from 'discord.js';

import { oneLine, stripIndent } from 'common-tags';
import guildChannelModel from '../models/guild/guildChannelModel.js';
import guildModel from '../models/guild/guildModel.js';
import nameUtil from '../util/nameUtil.js';
import { parseChannel } from '../util/parser.js';
import { registerComponent, registerSlashCommand } from 'bot/util/commandLoader.js';

type Setting =
  | 'noXp'
  | 'noCommand'
  | 'commandOnlyChannel'
  | 'autopost_serverJoin'
  | 'autopost_levelup';

const componentId = registerComponent<{
  channelId: string;
  type: ChannelType | null;
  setting: Setting;
}>({
  identifier: 'config-channel.set',
  type: ComponentType.Button,
  callback: async function (interaction, data) {
    const { channelId, type, setting } = data;

    // const [, memberId, channelId, channelType, type] = interaction.customId.split(' ');

    let myChannel = await guildChannelModel.storage.get(interaction.guild, channelId);

    if (setting === 'noXp' || setting === 'noCommand') {
      if (myChannel[setting])
        await guildChannelModel.storage.set(interaction.guild, channelId, setting, 0);
      else await guildChannelModel.storage.set(interaction.guild, channelId, setting, 1);

      myChannel = await guildChannelModel.storage.get(interaction.guild, channelId);
    } else {
      if (interaction.guild.appData[setting] == channelId)
        await guildModel.storage.set(interaction.guild, setting, 0);
      else await guildModel.storage.set(interaction.guild, setting, channelId);
    }

    await interaction.update({
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          generateRow(interaction, channelId, type, myChannel),
        ),
        _close(interaction.user.id),
      ],
    });
  },
});

const generateRow = (
  interaction: Interaction<'cached'>,
  channelId: string,
  type: ChannelType | null,
  myChannel,
) => {
  const ownerId = interaction.user.id;
  const r = [
    new ButtonBuilder().setLabel('No XP'),
    new ButtonBuilder().setLabel('No Commands'),
    new ButtonBuilder().setLabel('Command Only'),
    new ButtonBuilder().setLabel('Server Join Channel'),
    new ButtonBuilder().setLabel('Levelup Channel'),
  ];
  // r[0].setCustomId(`config-channel ${i.member.id} ${id} ${type} noXp`);
  function disableIfNotText(builder: ButtonBuilder) {
    if (type !== ChannelType.GuildText) {
      builder.setDisabled(true);
      builder.setStyle(ButtonStyle.Secondary);
    }
  }

  function getStyleFromEquivalence(check?: string) {
    return check === channelId ? ButtonStyle.Success : ButtonStyle.Danger;
  }

  r[0].setCustomId(componentId({ channelId, type, setting: 'noXp' }, { ownerId }));
  r[0].setStyle(myChannel.noXp ? ButtonStyle.Success : ButtonStyle.Danger);

  r[1].setCustomId(componentId({ channelId, type, setting: 'noCommand' }, { ownerId }));
  r[1].setDisabled(Boolean(parseInt(interaction.guild.appData.commandOnlyChannel)));
  r[1].setStyle(myChannel.noCommand ? ButtonStyle.Success : ButtonStyle.Danger);
  // r[1].setDisabled(type !== ChannelType.GuildText);
  // if (r[1].disabled) r[1].setStyle(ButtonStyle.Secondary);

  r[2].setCustomId(componentId({ channelId, type, setting: 'commandOnlyChannel' }, { ownerId }));
  r[2].setStyle(getStyleFromEquivalence(interaction.guild.appData.commandOnlyChannel));
  // r[2].setStyle(i.guild.appData.commandOnlyChannel === channelId ? ButtonStyle.Success : ButtonStyle.Danger);

  r[3].setCustomId(componentId({ channelId, type, setting: 'autopost_serverJoin' }, { ownerId }));
  r[3].setStyle(getStyleFromEquivalence(interaction.guild.appData.autopost_serverJoin));

  r[4].setCustomId(componentId({ channelId, type, setting: 'autopost_levelup' }, { ownerId }));
  r[4].setStyle(getStyleFromEquivalence(interaction.guild.appData.autopost_levelup));

  disableIfNotText(r[1]);
  disableIfNotText(r[2]);
  disableIfNotText(r[3]);
  disableIfNotText(r[4]);

  return r;
};

const closeId = registerComponent({
  identifier: 'config-channel.cls',
  type: ComponentType.Button,
  callback: async function (interaction) {
    await interaction.deferUpdate();
    return await interaction.deleteReply();
  },
});

const _close = (ownerId: string) =>
  new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel('Close')
      .setStyle(ButtonStyle.Danger)
      .setCustomId(closeId(null, { ownerId })),
  );

registerSlashCommand({
  data: new SlashCommandBuilder()
    .setName('config-channel')
    .setDescription("Change a channel's settings!")
    .addChannelOption((o) =>
      o
        .setName('channel')
        .setDescription('The channel to modify')
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildVoice, ChannelType.GuildForum),
    )
    .addStringOption((o) => o.setName('id').setDescription('The ID of the channel to modify')),
  execute: async function (interaction) {
    const resolvedChannel = await parseChannel(interaction);

    if (!resolvedChannel) {
      return await interaction.reply({
        content: "You need to specify either a channel or a channel's ID!",
        ephemeral: true,
      });
    }

    if (
      !interaction.member.permissionsIn(interaction.channel!).has(PermissionFlagsBits.ManageGuild)
    ) {
      return await interaction.reply({
        content: 'You need the permission to manage the server in order to use this command.',
        ephemeral: true,
      });
    }

    const myChannel = await guildChannelModel.storage.get(interaction.guild, resolvedChannel.id);

    const e = new EmbedBuilder()
      .setAuthor({ name: 'Channel Settings' })
      .setDescription(
        nameUtil.getChannelMention(interaction.guild.channels.cache, resolvedChannel.id),
      )
      .setColor(0x00ae86)
      .addFields({
        name: 'No XP',
        value: 'If this is enabled, no xp will be given in this channel.',
      });

    if (
      !resolvedChannel.channel ||
      [ChannelType.GuildText, ChannelType.GuildForum].includes(resolvedChannel.channel.type)
    ) {
      e.addFields({
        name: 'No Commands',
        value: stripIndent`If this is enabled, commands will not work in this channel.
      **Note:** It is recommended to use the Discord native system in \`Server Settings -> Integrations -> ActivityRank\`.`,
      });
      e.addFields({
        name: 'Command Only',
        value: oneLine`If this is enabled, this will be the **only channel commands will work in**,
          unless you have the \`manage server\` permission.`,
      });
      e.addFields({
        name: 'Server Join Channel',
        value: 'If this is enabled, server join messages will be sent to this channel.',
      });
      e.addFields({
        name: 'Levelup Channel',
        value: 'If this is enabled, levelup messages will be sent to this channel.',
      });
    }

    await interaction.reply({
      embeds: [e],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          generateRow(
            interaction,
            resolvedChannel.id,
            resolvedChannel.channel ? resolvedChannel.channel.type : null,
            myChannel,
          ),
        ),
        _close(interaction.user.id),
      ],
    });
  },
});
