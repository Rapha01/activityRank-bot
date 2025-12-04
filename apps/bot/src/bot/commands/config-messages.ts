import {
  type BaseMessageOptions,
  ButtonStyle,
  type ComponentInContainerData,
  ComponentType,
  type ContainerComponentData,
  type Interaction,
  MessageFlags,
  type ModalComponentData,
  PermissionFlagsBits,
  TextInputStyle,
} from 'discord.js';
import type { TFunction } from 'i18next';
import invariant from 'tiny-invariant';
import { command } from '#bot/commands.ts';
import { actionrow, container } from '#bot/util/component.ts';
import { requireUser } from '#bot/util/predicates.ts';
import { component, modal } from '#bot/util/registry/component.ts';
import { type GuildModel, getGuildModel } from '../models/guild/guildModel.ts';

type ServerMessage =
  | 'serverJoinMessage'
  | 'levelupMessage'
  | 'roleAssignMessage'
  | 'roleDeassignMessage';

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
        customId: messageButton.instanceId({ data: { message, editOriginal: true }, predicate }),
        style: ButtonStyle.Primary,
        label: t('config-messages.button.edit'),
      },
      {
        type: ComponentType.Button,
        customId: clearMessageButton.instanceId({ data: { message }, predicate }),
        style: ButtonStyle.Secondary,
        disabled: cachedGuild.db[message] === '',
        label: t('config-messages.button.clear'),
      },
      {
        type: ComponentType.Button,
        customId: testMessageButton.instanceId({ data: { message }, predicate }),
        style: ButtonStyle.Secondary,
        disabled: cachedGuild.db[message] === '',
        label: t('config-messages.button.test'),
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

interface ModalOptions {
  t: TFunction<'command-content'>;
  value: string;
  message: ServerMessage;
  editOriginal: boolean;
}

function generateModal({ t, value, message, editOriginal }: ModalOptions): ModalComponentData {
  return {
    customId: setModal.instanceId({ data: { message, editOriginal } }),
    title: t('config-messages.select'),
    components: [
      actionrow([
        {
          customId: 'msg-component-1',
          label: t(`config-messages.${message}New`),
          type: ComponentType.TextInput,
          style: TextInputStyle.Paragraph,
          required: true,
          maxLength: message === 'levelupMessage' ? 1000 : 500,
          value,
        },
      ]),
    ],
  };
}

const clearMessageButton = component<{ message: ServerMessage }>({
  type: ComponentType.Button,
  async callback({ interaction, data, t }) {
    await interaction.deferUpdate();

    const model = await getGuildModel(interaction.guild);
    await model.upsert({ [data.message]: '' });

    await interaction.editReply({ components: await renderPage(t, model, interaction) });
  },
});

const testMessageButton = component<{ message: ServerMessage }>({
  type: ComponentType.Button,
  async callback({ interaction, data, t }) {
    const model = await getGuildModel(interaction.guild);
    const value = model.db[data.message];

    await interaction.reply({
      components: [
        container(
          [
            {
              type: ComponentType.TextDisplay,
              content: `## ${t(`config-messages.${data.message}`)}`,
            },
            {
              type: ComponentType.Section,
              components: [
                // TODO: list only relevant variables for the message that was edited
                {
                  type: ComponentType.TextDisplay,
                  content: `-# ${t('config-messages.editAgain')}`,
                },
              ],
              accessory: {
                type: ComponentType.Button,
                customId: messageButton.instanceId({
                  data: { message: data.message, editOriginal: false },
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
      flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
    });
  },
});

const messageButton = component<{ message: ServerMessage; editOriginal: boolean }>({
  type: ComponentType.Button,
  async callback({ interaction, data, t }) {
    const model = await getGuildModel(interaction.guild);
    const value = model.db[data.message];

    await interaction.showModal(generateModal({ ...data, t, value }));
  },
});

const setModal = modal<{ message: ServerMessage; editOriginal: boolean }>({
  async callback({ interaction, data, t }) {
    const value = interaction.fields.getTextInputValue('msg-component-1');
    await interaction.deferUpdate();

    const model = await getGuildModel(interaction.guild);
    await model.upsert({ [data.message]: value });

    const response = {
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
                // TODO: list only relevant variables for the message that was edited
                {
                  type: ComponentType.TextDisplay,
                  content: `-# ${t('config-messages.editAgain')}`,
                },
              ],
              accessory: {
                type: ComponentType.Button,
                customId: messageButton.instanceId({
                  data: { message: data.message, editOriginal: false },
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
    } as const;

    if (data.editOriginal) {
      // update initial message
      await interaction.editReply({ components: await renderPage(t, model, interaction) });
      // send a follow-up response
      await interaction.followUp({
        ...response,
        flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
      });
    } else {
      // just edit current follow up response
      await interaction.editReply(response);
    }
  },
});
