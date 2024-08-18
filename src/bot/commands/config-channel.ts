import {
  ActionRowBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
  ComponentType,
  type Interaction,
  ApplicationCommandOptionType,
} from 'discord.js';

import { stripIndent } from 'common-tags';
import guildChannelModel from '../models/guild/guildChannelModel.js';
import { getGuildModel, type GuildModel } from '../models/guild/guildModel.js';
import nameUtil from '../util/nameUtil.js';
import { ParserResponseStatus, parseChannel } from '../util/parser.js';
import type { GuildChannelSchema } from 'models/types/shard.js';
import { command, permissions } from 'bot/util/registry/command.js';
import { component } from 'bot/util/registry/component.js';
import { requireUser, requireUserId } from 'bot/util/predicates.js';
import { actionrow, closeButton } from 'bot/util/component.js';

type Setting =
  | 'noXp'
  | 'noCommand'
  | 'commandOnlyChannel'
  | 'autopost_serverJoin'
  | 'autopost_levelup';

const noCommandButton = component<{ channelId: string; type: ChannelType | null }>({
  type: ComponentType.Button,
  async callback({ interaction, data }) {
    const { channelId, type } = data;

    let myChannel = await guildChannelModel.storage.get(interaction.guild, channelId);
    const cachedGuild = await getGuildModel(interaction.guild);

    if (myChannel.noCommand) {
      await guildChannelModel.storage.set(interaction.guild, channelId, 'noCommand', 0);
    } else {
      await interaction.reply({
        embeds: [
          {
            title: 'Oops!',
            description:
              '## No-Command Channels are __deprecated__.\n\nManage Application Command permissions in **[Server Settings](discord://-/guilds/${interaction.guild.id}/settings)** > **Integrations** > **ActivityRank** instead!\n\n*You can still **disable** No-Command channels.*',
            color: 0xfe5326,
          },
        ],
      });
      return;
    }

    myChannel = await guildChannelModel.storage.get(interaction.guild, channelId);

    await interaction.update({
      components: [
        actionrow(generateRow(interaction, channelId, type, cachedGuild, myChannel)),
        _close(interaction.user.id),
      ],
    });
  },
});

const settingButton = component<{
  channelId: string;
  type: ChannelType | null;
  setting: Setting;
}>({
  type: ComponentType.Button,
  async callback({ interaction, data }) {
    const { channelId, type, setting } = data;

    let myChannel = await guildChannelModel.storage.get(interaction.guild, channelId);

    const cachedGuild = await getGuildModel(interaction.guild);

    if (setting === 'noXp' || setting === 'noCommand') {
      if (myChannel[setting])
        await guildChannelModel.storage.set(interaction.guild, channelId, setting, 0);
      else await guildChannelModel.storage.set(interaction.guild, channelId, setting, 1);

      myChannel = await guildChannelModel.storage.get(interaction.guild, channelId);
    } else {
      if (cachedGuild.db[setting] == channelId) await cachedGuild.upsert({ [setting]: '0' });
      else await cachedGuild.upsert({ [setting]: channelId });
    }

    await interaction.update({
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          generateRow(interaction, channelId, type, cachedGuild, myChannel),
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
  myGuild: GuildModel,
  myChannel: GuildChannelSchema,
) => {
  const r = [
    new ButtonBuilder().setLabel('No XP'),
    new ButtonBuilder().setLabel('No Commands'),
    new ButtonBuilder().setLabel('Command Only'),
    new ButtonBuilder().setLabel('Server Join Channel'),
    new ButtonBuilder().setLabel('Levelup Channel'),
  ];

  function disableIfNotText(builder: ButtonBuilder) {
    if (type !== ChannelType.GuildText) {
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

  r[1].setCustomId(
    noCommandButton.instanceId({
      data: { channelId, type },
      predicate: requireUser(interaction.user),
    }),
  );
  r[1].setDisabled(Boolean(parseInt(myGuild.db.commandOnlyChannel)));
  r[1].setStyle(myChannel.noCommand ? ButtonStyle.Success : ButtonStyle.Danger);
  // r[1].setDisabled(type !== ChannelType.GuildText);
  // if (r[1].disabled) r[1].setStyle(ButtonStyle.Secondary);

  r[2].setCustomId(getButton('commandOnlyChannel'));
  r[2].setStyle(getStyleFromEquivalence(myGuild.db.commandOnlyChannel));
  // r[2].setStyle(i.guild.appData.commandOnlyChannel === channelId ? ButtonStyle.Success : ButtonStyle.Danger);

  r[3].setCustomId(getButton('autopost_serverJoin'));
  r[3].setStyle(getStyleFromEquivalence(myGuild.db.autopost_serverJoin));

  r[4].setCustomId(getButton('autopost_levelup'));
  r[4].setStyle(getStyleFromEquivalence(myGuild.db.autopost_levelup));

  disableIfNotText(r[1]);
  disableIfNotText(r[2]);
  disableIfNotText(r[3]);
  disableIfNotText(r[4]);

  return r;
};

const _close = (ownerId: string) =>
  new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel('Close')
      .setStyle(ButtonStyle.Danger)
      .setCustomId(closeButton.instanceId({ predicate: requireUserId(ownerId) })),
  );

export default command.basic({
  data: {
    name: 'config-channel',
    description: "Change a channel's settings.",
    options: [
      {
        name: 'channel',
        description: 'The channel to modify',
        channel_types: [ChannelType.GuildText, ChannelType.GuildVoice, ChannelType.GuildForum],
        type: ApplicationCommandOptionType.Channel,
      },
      {
        name: 'id',
        description: 'The ID of the channel to modify',
        type: ApplicationCommandOptionType.String,
        min_length: 17,
        max_length: 20,
      },
    ],
    default_member_permissions: permissions(permissions.ManageChannels, permissions.ManageGuild),
  },
  async execute({ interaction }) {
    const resolvedChannel = parseChannel(interaction);
    if (resolvedChannel.status === ParserResponseStatus.ConflictingInputs) {
      await interaction.reply({
        content: `You have specified both a channel and an ID, but they don't match.\nDid you mean: "/config-channel channel:${interaction.options.get('channel')!.value}"?`,
        ephemeral: true,
      });
      return;
    } else if (resolvedChannel.status === ParserResponseStatus.NoInput) {
      await interaction.reply({
        content: "You need to specify either a channel or a channel's ID!",
        ephemeral: true,
      });
      return;
    }

    if (
      !interaction.member.permissionsIn(interaction.channel!).has(PermissionFlagsBits.ManageGuild)
    ) {
      await interaction.reply({
        content: 'You need the permission to manage the server in order to use this command.',
        ephemeral: true,
      });
      return;
    }

    const myChannel = await guildChannelModel.storage.get(interaction.guild, resolvedChannel.id);

    const embed = new EmbedBuilder()
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
      !resolvedChannel.object ||
      [ChannelType.GuildText, ChannelType.GuildForum].includes(resolvedChannel.object.type)
    ) {
      embed.addFields(
        {
          name: 'No Commands',
          value: stripIndent`If this is enabled, commands will not work in this channel.
            > **Note:** It is recommended to use the Discord native system in \`Server Settings -> Integrations -> ActivityRank\` instead.`,
        },
        {
          name: 'Command Only',
          value: stripIndent`If this is enabled, this will be the **only channel commands will work in**, unless you have the \`Manage Server\` permission.
            > **Note:** It is recommended to use the Discord native system in \`Server Settings -> Integrations -> ActivityRank\` instead.`,
        },
        {
          name: 'Server Join Channel',
          value: 'If this is enabled, server join messages will be sent to this channel.',
        },
        {
          name: 'Levelup Channel',
          value: 'If this is enabled, levelup messages will be sent to this channel.',
        },
      );
    }

    const cachedGuild = await getGuildModel(interaction.guild);

    await interaction.reply({
      embeds: [embed],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          generateRow(
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
