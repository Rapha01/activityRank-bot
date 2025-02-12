import {
  EmbedBuilder,
  ButtonStyle,
  TextInputStyle,
  PermissionFlagsBits,
  type Interaction,
  type ModalComponentData,
  type SelectMenuComponentOptionData,
} from 'discord.js';
import { getGuildModel } from '../models/guild/guildModel.js';
import { ComponentType } from 'discord.js';
import { command } from '#bot/commands.js';
import { component, modal } from '#bot/util/registry/component.js';
import { requireUser } from '#bot/util/predicates.js';
import { actionrow } from '#bot/util/component.js';
import type { TFunction } from 'i18next';

const generateRows = async (
  t: TFunction<'command-content'>,
  interaction: Interaction<'cached'>,
) => {
  const predicate = requireUser(interaction.user);

  return [
    actionrow([
      {
        type: ComponentType.StringSelect,
        placeholder: 'The message to set',
        customId: messageSelect.instanceId({ predicate }),
        options: selectOptions(t),
      },
    ]),
    actionrow([
      {
        type: ComponentType.Button,
        label: 'Clear a message',
        style: ButtonStyle.Danger,
        customId: clearButton.instanceId({ predicate }),
      },
    ]),
  ];
};

type ServerMessage =
  | 'serverJoinMessage'
  | 'levelupMessage'
  | 'roleAssignMessage'
  | 'roleDeassignMessage';

const idToName = (id: ServerMessage, t: TFunction<'command-content'>): string => {
  return {
    serverJoinMessage: t('config-messages.joinMessage'),
    levelupMessage: t('config-messages.levelupMessage'),
    roleAssignMessage: t('config-messages.assignMessage'),
    roleDeassignMessage: t('config-messages.deassignMessage'),
  }[id];
};

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
        label: `The ${idToName(message, t)}`,
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

    const embed = {
      author: { name: 'Server Messages' },
      color: 0x00ae86,
      fields: [
        {
          name: t('config-messages.joinMessage'),
          value: t('config-messages.joinMessageDescription'),
        },
        {
          name: t('config-messages.levelupMessage'),
          value: t('config-messages.levelupMessageDescription'),
        },
        {
          name: t('config-messages.assignMessage'),
          value: t('config-messages.assignMessageDescription'),
        },
        {
          name: t('config-messages.deassignMessage'),
          value: t('config-messages.deassignMessageDescription'),
        },
      ],
    };

    await interaction.reply({
      embeds: [embed],
      components: await generateRows(t, interaction),
      ephemeral: true,
    });
  },
});

const clearButton = component({
  type: ComponentType.Button,
  async callback({ interaction, t }) {
    await interaction.reply({
      content: t('config-messages.askClear'),
      components: [
        actionrow([
          {
            customId: clearMessageSelect.instanceId({ predicate: requireUser(interaction.user) }),
            type: ComponentType.StringSelect,
            placeholder: t('config-messages.toClear'),
            options: selectOptions(t),
          },
        ]),
      ],
      ephemeral: true,
    });
  },
});

const clearMessageSelect = component({
  type: ComponentType.StringSelect,
  async callback({ interaction, t }) {
    const clearItem = interaction.values[0] as ServerMessage;

    const model = await getGuildModel(interaction.guild);
    model.upsert({ [clearItem]: '' });

    await interaction.reply({
      content: t('config-messages.cleared', { value: idToName(clearItem, t) }),
      ephemeral: true,
    });
  },
});

const messageSelect = component({
  type: ComponentType.StringSelect,
  async callback({ interaction, t }) {
    const editItem = interaction.values[0] as ServerMessage;
    await interaction.showModal(generateModal(t, editItem));
  },
});

const setModal = modal<{ message: ServerMessage }>({
  async callback({ interaction, data, t }) {
    const value = interaction.fields.getTextInputValue('msg-component-1');
    await interaction.deferReply({ ephemeral: true });

    const model = await getGuildModel(interaction.guild);
    model.upsert({ [data.message]: value });

    await interaction.followUp({
      content: `Set ${idToName(data.message, t)}`,
      embeds: [new EmbedBuilder().setDescription(value).setColor('#4fd6c8')],
      ephemeral: true,
    });
  },
});

const selectOptions = (
  t: TFunction<'command-content'>,
): readonly SelectMenuComponentOptionData[] => {
  return [
    { label: t('config-messages.joinMessage'), value: 'serverJoinMessage' },
    { label: t('config-messages.levelupMessage'), value: 'levelupMessage' },
    { label: t('config-messages.assignMessage'), value: 'roleAssignMessage' },
    { label: t('config-messages.deassignMessage'), value: 'roleDeassignMessage' },
  ] satisfies { label: string; value: ServerMessage }[];
};
