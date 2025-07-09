import {
  ButtonStyle,
  PermissionFlagsBits,
  ComponentType,
  MessageFlags,
  SelectMenuDefaultValueType,
  ChannelType,
  type BaseMessageOptions,
  type ComponentInContainerData,
  type ContainerComponentData,
  type User,
} from 'discord.js';
import { getGuildModel, type GuildModel } from '../../models/guild/guildModel.js';
import { command } from '#bot/commands.js';
import { actionrow, container } from '#bot/util/component.js';
import { requireUser } from '#bot/util/predicates.js';
import { component, type ComponentPredicateConfig } from '#bot/util/registry/component.js';
import type { TFunction } from 'i18next';
import { assertUnreachable } from '#bot/util/typescript.js';

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

    await interaction.reply({
      components: await renderPage(t, 'general', cachedGuild, interaction.user),
      flags: [MessageFlags.IsComponentsV2],
    });
  },
});

type PageId = 'general' | 'voice' | 'notify' | 'types';
// Except for cases like `notifyLevelupSetChannel`, PageItemIds should be boolean guild config options.
type PageItemId =
  // General
  | 'showNicknames'
  | 'reactionVote'
  | 'takeAwayAssignedRolesOnLevelDown'
  | 'resetDeletedMembers'
  | 'stickyLevelRoles'

  // Voice
  | 'allowMutedXp'
  | 'allowDeafenedXp'
  | 'allowSoloXp'

  // Notifications
  | 'notifyLevelupDm'
  | 'notifyLevelupCurrentChannel'
  | 'notifyLevelupSetChannel'
  | 'notifyLevelupWithRole'

  // XP Types
  | 'textXp'
  | 'voiceXp'
  | 'inviteXp'
  | 'voteXp';

async function renderPage(
  t: TFunction<'command-content'>,
  id: PageId,
  cachedGuild: GuildModel,
  user: User,
): Promise<BaseMessageOptions['components']> {
  const top_components: ComponentInContainerData[] = [
    {
      type: ComponentType.TextDisplay,
      content: `## ${t('config-server.settings')}`,
    },
    { type: ComponentType.Separator, spacing: 2 },
  ];

  let main: ContainerComponentData;
  const page = id;
  const predicate = requireUser(user);
  const globalOpts = { t, cachedGuild, page, predicate };
  if (id === 'general') {
    main = container(
      [
        ...top_components,
        renderPageItem({ ...globalOpts, id: 'showNicknames' }),
        renderPageItem({ ...globalOpts, id: 'reactionVote' }),
        renderPageItem({ ...globalOpts, id: 'takeAwayAssignedRolesOnLevelDown' }),
        renderPageItem({ ...globalOpts, id: 'resetDeletedMembers' }),
        renderPageItem({ ...globalOpts, id: 'stickyLevelRoles' }),
      ],
      { accentColor: 0x01c3d9 },
    );
  } else if (id === 'voice') {
    main = container(
      [
        ...top_components,
        renderPageItem({ ...globalOpts, id: 'allowMutedXp', buttonTranslation: 'allowed' }),
        renderPageItem({ ...globalOpts, id: 'allowDeafenedXp', buttonTranslation: 'allowed' }),
        renderPageItem({ ...globalOpts, id: 'allowSoloXp', buttonTranslation: 'allowed' }),
      ],
      { accentColor: 0x01c3d9 },
    );
  } else if (id === 'notify') {
    main = container(
      [
        ...top_components,
        renderPageItem({
          ...globalOpts,
          id: 'notifyLevelupDm',
          disabled:
            cachedGuild.db.notifyLevelupCurrentChannel === 1 ||
            cachedGuild.db.autopost_levelup !== '0',
        }),
        renderPageItem({
          ...globalOpts,
          id: 'notifyLevelupCurrentChannel',
          disabled: cachedGuild.db.autopost_levelup !== '0',
        }),
        {
          type: ComponentType.Section,
          components: [
            {
              type: ComponentType.TextDisplay,
              content: `### ${t('config-server.notifyLevelupSetChannel.label')}\n${t('config-server.notifyLevelupSetChannel.description')}`,
            },
          ],
          accessory: {
            type: ComponentType.Button,
            customId: clearLevelupChannel.instanceId({ data: { page }, predicate }),
            style: ButtonStyle.Danger,
            label: t('config-server.button.clear'),
            disabled: cachedGuild.db.autopost_levelup === '0',
          },
        },
        actionrow([
          {
            type: ComponentType.ChannelSelect,
            customId: setLevelupChannel.instanceId({ data: { page }, predicate }),
            defaultValues:
              cachedGuild.db.autopost_levelup === '0'
                ? []
                : [
                    {
                      id: cachedGuild.db.autopost_levelup,
                      type: SelectMenuDefaultValueType.Channel,
                    },
                  ],
            channelTypes: [ChannelType.GuildText],
          },
        ]),
        renderPageItem({ ...globalOpts, id: 'notifyLevelupWithRole' }),
      ],
      { accentColor: 0x01c3d9 },
    );
  } else if (id === 'types') {
    main = container(
      [
        ...top_components,
        renderPageItem({ ...globalOpts, id: 'textXp' }),
        renderPageItem({ ...globalOpts, id: 'voiceXp' }),
        renderPageItem({ ...globalOpts, id: 'inviteXp' }),
        renderPageItem({ ...globalOpts, id: 'voteXp' }),
      ],
      { accentColor: 0x01c3d9 },
    );
  } else {
    assertUnreachable(id);
  }

  return [
    main,
    {
      type: ComponentType.ActionRow,
      components: [
        {
          type: ComponentType.StringSelect,
          customId: setPage.instanceId({ predicate }),
          options: [
            {
              label: t('config-server.page.general.label'),
              value: 'general',
              default: id === 'general',
              description: t('config-server.page.general.description'),
              emoji: { name: '⚙️' },
            },
            {
              label: t('config-server.page.voice.label'),
              value: 'voice',
              default: id === 'voice',
              description: t('config-server.page.voice.description'),
              emoji: { name: '🎤' },
            },
            {
              label: t('config-server.page.notify.label'),
              value: 'notify',
              default: id === 'notify',
              description: t('config-server.page.notify.description'),
              emoji: { name: '💬' },
            },
            {
              label: t('config-server.page.types.label'),
              value: 'types',
              default: id === 'types',
              description: t('config-server.page.types.description'),
              emoji: { name: '✍🏻' },
            },
          ],
        },
      ],
    },
  ];
}

interface RenderPageItemOptions {
  t: TFunction<'command-content'>;
  id: Exclude<PageItemId, 'notifyLevelupSetChannel'>;
  /** The current page the display is set to */
  page: PageId;
  /** The predicate required for the button to be activated */
  predicate: ComponentPredicateConfig;
  /** The GuildModel - checked to find what state the button should be in */
  cachedGuild: GuildModel;
  /** Whether the button should be rendered as disabled */
  disabled?: boolean;
  /** How the button should describe its state ("Enabled"/"Disabled" vs "Allowed"/"Disallowed") */
  buttonTranslation?: 'enabled' | 'allowed';
}

function renderPageItem({
  t,
  id,
  page,
  predicate,
  cachedGuild,
  disabled = false,
  buttonTranslation = 'enabled',
}: RenderPageItemOptions): ComponentInContainerData {
  const hasNoDescription = (s: string): s is 'textXp' | 'voiceXp' | 'inviteXp' | 'voteXp' =>
    ['textXp', 'voiceXp', 'inviteXp', 'voteXp'].includes(s);

  const content = hasNoDescription(id)
    ? `### ${t(`config-server.${id}.label`)}`
    : `### ${t(`config-server.${id}.label`)}\n${t(`config-server.${id}.description`)}`;

  const on = cachedGuild.db[id] === 1;

  return {
    type: ComponentType.Section,
    components: [{ type: ComponentType.TextDisplay, content }],
    accessory: {
      type: ComponentType.Button,
      customId: setBoolButton.instanceId({ data: { page, key: id }, predicate }),
      style: on ? ButtonStyle.Success : ButtonStyle.Danger,
      label: on
        ? t(`config-server.button.${buttonTranslation}`)
        : t(`config-server.button.not-${buttonTranslation}`),
      disabled,
    },
  };
}

const setPage = component({
  type: ComponentType.StringSelect,
  autoDestroy: true,
  async callback({ interaction, t }) {
    const cachedGuild = await getGuildModel(interaction.guild);

    await interaction.update({
      components: await renderPage(
        t,
        interaction.values[0] as PageId,
        cachedGuild,
        interaction.user,
      ),
    });
  },
});

const setBoolButton = component<{ key: BooleanGuildKey; page: PageId }>({
  type: ComponentType.Button,
  autoDestroy: true,
  async callback({ interaction, data, t }) {
    const cachedGuild = await getGuildModel(interaction.guild);

    if (cachedGuild.db[data.key]) await cachedGuild.upsert({ [data.key]: 0 });
    else await cachedGuild.upsert({ [data.key]: 1 });

    await interaction.update({
      components: await renderPage(t, data.page, cachedGuild, interaction.user),
    });
  },
});

const clearLevelupChannel = component<{ page: PageId }>({
  type: ComponentType.Button,
  autoDestroy: true,
  async callback({ interaction, data, t }) {
    const cachedGuild = await getGuildModel(interaction.guild);

    await cachedGuild.upsert({ autopost_levelup: '0' });

    await interaction.update({
      components: await renderPage(t, data.page, cachedGuild, interaction.user),
    });
  },
});

const setLevelupChannel = component<{ page: PageId }>({
  type: ComponentType.ChannelSelect,
  autoDestroy: true,
  async callback({ interaction, data, t }) {
    const cachedGuild = await getGuildModel(interaction.guild);

    await cachedGuild.upsert({ autopost_levelup: interaction.values[0] });

    await interaction.update({
      components: await renderPage(t, data.page, cachedGuild, interaction.user),
    });
  },
});
