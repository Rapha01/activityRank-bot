import type { ShardDB } from '@activityrank/database';
import type {
  BaseMessageOptions,
  ComponentInContainerData,
  ContainerComponentData,
  Interaction,
} from 'discord.js';
import { ButtonStyle, ComponentType, MessageFlags, PermissionFlagsBits } from 'discord.js';
import type { TFunction } from 'i18next';
import invariant from 'tiny-invariant';
import { command } from '#bot/commands.ts';
import { container } from '#bot/util/component.ts';
import { getChannelMention } from '#bot/util/nameUtil.ts';
import { requireUser } from '#bot/util/predicates.ts';
import { component } from '#bot/util/registry/component.ts';
import guildChannelModel from '../models/guild/guildChannelModel.ts';
import { ParserResponseStatus, parseChannel } from '../util/parser.ts';

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

    // ! FIXME may be `channelId = 0` because that's the value of `defaultAll`
    const myChannel = await guildChannelModel.storage.get(interaction.guild, resolvedChannel.id);

    await interaction.reply({
      components: await renderPage(t, resolvedChannel.id, myChannel, interaction),
      flags: [MessageFlags.IsComponentsV2],
    });
  },
});

async function renderPage(
  t: TFunction<'command-content'>,
  channelId: string,
  myChannel: ShardDB.GuildChannel,
  interaction: Interaction,
): Promise<BaseMessageOptions['components']> {
  invariant(interaction.guild);

  const top_components: ComponentInContainerData[] = [
    {
      type: ComponentType.TextDisplay,
      content: `## ${t('config-channel.channelSettings')} • ${getChannelMention(interaction.guild.channels.cache, channelId)}`,
    },
    { type: ComponentType.Separator, spacing: 2 },
  ];

  const predicate = requireUser(interaction.user);
  const enabled = myChannel.noXp === 0;
  const main: ContainerComponentData = container(
    [
      ...top_components,
      {
        type: ComponentType.Section,
        components: [
          {
            type: ComponentType.TextDisplay,
            content: `### ${t('config-channel.allowXp')}\n${t('config-channel.allowXpDescription')}`,
          },
        ],
        accessory: {
          type: ComponentType.Button,
          customId: toggleButton.instanceId({ data: { channelId }, predicate }),
          style: enabled ? ButtonStyle.Success : ButtonStyle.Danger,
          label: enabled ? t('config-channel.button.award') : t('config-channel.button.not-award'),
        },
      },
    ],
    { accentColor: 0x01c3d9 },
  );

  return [main];
}

const toggleButton = component<{ channelId: string }>({
  type: ComponentType.Button,
  autoDestroy: true,
  async callback({ interaction, data, t }) {
    let myChannel = await guildChannelModel.storage.get(interaction.guild, data.channelId);

    if (myChannel.noXp === 1)
      await guildChannelModel.storage.set(interaction.guild, data.channelId, 'noXp', 0);
    else await guildChannelModel.storage.set(interaction.guild, data.channelId, 'noXp', 1);

    myChannel = await guildChannelModel.storage.get(interaction.guild, data.channelId);

    await interaction.update({
      components: await renderPage(t, data.channelId, myChannel, interaction),
    });
  },
});
