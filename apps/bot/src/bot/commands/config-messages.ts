import {
  ButtonStyle,
  TextInputStyle,
  PermissionFlagsBits,
  type Interaction,
  type ModalComponentData,
  type BaseMessageOptions,
  type ContainerComponentData,
  MessageFlags,
  type ComponentInContainerData,
} from 'discord.js';
import { getGuildModel, type GuildModel } from '../models/guild/guildModel.js';
import { ComponentType } from 'discord.js';
import { command } from '#bot/commands.js';
import { component, modal } from '#bot/util/registry/component.js';
import { requireUser } from '#bot/util/predicates.js';
import { actionrow, container } from '#bot/util/component.js';
import type { TFunction } from 'i18next';
import invariant from 'tiny-invariant';

type ServerMessage =
  | 'serverJoinMessage'
  | 'levelupMessage'
  | 'roleAssignMessage'
  | 'roleDeassignMessage';

const generateModal = (
  t: TFunction<'command-content'>,
  message: ServerMessage,
): ModalComponentData => ({
  customId: setModal.instanceId({ data: { message } }),
  title: t('config-messages.select'),
  components: [
    actionrow([
      {
        customId: 'msg-component-1',
        label: t(`config-messages.${message}New`),
        type: ComponentType.TextInput,
        style: TextInputStyle.Paragraph,
        maxLength: message === 'levelupMessage' ? 1000 : 500,
        required: true,
      },
    ]),
  ],
});

export default command({
  name: 'config-messages',
  async execute({ interaction, t }) {
    if (
      interaction.channel &&
      !interaction.member.permissionsIn(interaction.channel).has(PermissionFlagsBits.ManageGuild)
    ) {
      await interaction.reply({ content: t('missing.manageServer'), ephemeral: true });
      return;
    }

    const guildModel = await getGuildModel(interaction.guild);

    await interaction.reply({
      components: await renderPage(t, guildModel, interaction),
      flags: [MessageFlags.IsComponentsV2],
    });
  },
});

async function renderPage(
  t: TFunction<'command-content'>,
  cachedGuild: GuildModel,
  interaction: Interaction,
): Promise<BaseMessageOptions['components']> {
  invariant(interaction.guild);

  const section = (message: ServerMessage): ComponentInContainerData[] => [
    {
      type: ComponentType.TextDisplay,
      content: `### ${t(`config-messages.${message}`)}\n${t(`config-messages.${message}Description`)}`,
    },
    actionrow([
      {
        type: ComponentType.Button,
        customId: messageButton.instanceId({ data: { message }, predicate }),
        style: ButtonStyle.Secondary,
        label: t('config-messages.button.edit'),
      },
      {
        type: ComponentType.Button,
        customId: clearMessageButton.instanceId({ data: { message }, predicate }),
        style: ButtonStyle.Secondary,
        disabled: cachedGuild.db[message] === '',
        label: t('config-role.button.clear'),
      },
    ]),
  ];

  const predicate = requireUser(interaction.user);
  const main: ContainerComponentData = container(
    [
      {
        type: ComponentType.TextDisplay,
        content: `## ${t('config-messages.header')}`,
      },
      {
        type: ComponentType.TextDisplay,
        content: t('config-messages.description'),
      },
      { type: ComponentType.Separator, spacing: 2 },
      ...section('serverJoinMessage'),
      ...section('levelupMessage'),
      ...section('roleAssignMessage'),
      ...section('roleDeassignMessage'),
    ],
    { accentColor: 0x01c3d9 },
  );

  return [main];
}

const clearMessageButton = component<{ message: ServerMessage }>({
  type: ComponentType.Button,
  async callback({ interaction, data, t }) {
    const model = await getGuildModel(interaction.guild);
    model.upsert({ [data.message]: '' });

    await interaction.reply({
      content: t('config-messages.cleared', { value: t(`config-messages.${data.message}`) }),
      ephemeral: true,
    });
  },
});

const messageButton = component<{ message: ServerMessage }>({
  type: ComponentType.Button,
  async callback({ interaction, data, t }) {
    await interaction.showModal(generateModal(t, data.message));
  },
});

const setModal = modal<{ message: ServerMessage }>({
  async callback({ interaction, data, t }) {
    const value = interaction.fields.getTextInputValue('msg-component-1');
    await interaction.deferReply({ ephemeral: true });

    const model = await getGuildModel(interaction.guild);
    model.upsert({ [data.message]: value });

    await interaction.followUp({
      components: [
        container(
          [
            {
              type: ComponentType.TextDisplay,
              content: `## ${t(`config-messages.${data.message}Set`)}`,
            },
            {
              type: ComponentType.Section,
              components: [
                { type: ComponentType.TextDisplay, content: t('config-messages.editAgain') },
              ],
              accessory: {
                type: ComponentType.Button,
                customId: messageButton.instanceId({
                  data,
                  predicate: requireUser(interaction.user),
                }),
                style: ButtonStyle.Secondary,
                label: t('config-messages.button.edit'),
              },
            },
            { type: ComponentType.Separator, spacing: 2 },
            { type: ComponentType.TextDisplay, content: value },
          ],
          { accentColor: 0x01c3d9 },
        ),
      ],
      flags: [MessageFlags.IsComponentsV2],
    });
  },
});
