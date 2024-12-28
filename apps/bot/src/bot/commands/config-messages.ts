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
import { command, permissions } from '#bot/util/registry/command.js';
import { component, modal } from '#bot/util/registry/component.js';
import { requireUser } from '#bot/util/predicates.js';
import { actionrow } from '#bot/util/component.js';

const generateRows = async (interaction: Interaction<'cached'>) => {
  const predicate = requireUser(interaction.user);

  return [
    actionrow([
      {
        type: ComponentType.StringSelect,
        placeholder: 'The message to set',
        customId: messageSelect.instanceId({ predicate }),
        options: selectOptions,
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

const _prettifyId: Record<ServerMessage, string> = {
  serverJoinMessage: 'Server Join Message',
  levelupMessage: 'Levelup Message',
  roleAssignMessage: 'Role Assign Message',
  roleDeassignMessage: 'Role Deassign Message',
};

const generateModal = (message: ServerMessage): ModalComponentData => ({
  customId: setModal.instanceId({ data: { message } }),
  title: 'Message Selection',
  components: [
    actionrow([
      {
        customId: 'msg-component-1',
        label: `The ${_prettifyId[message]}`,
        type: ComponentType.TextInput,
        style: TextInputStyle.Paragraph,
        maxLength: message === 'levelupMessage' ? 1000 : 500,
        required: true,
      },
    ]),
  ],
});

export default command.basic({
  data: {
    name: 'config-messages',
    description: "Configure the server's autopost messages.",
    default_member_permissions: permissions(permissions.ManageGuild),
  },
  async execute({ interaction }) {
    if (
      !interaction.member.permissionsIn(interaction.channel!).has(PermissionFlagsBits.ManageGuild)
    ) {
      await interaction.reply({
        content: 'You need the permission to manage the server in order to use this command.',
        ephemeral: true,
      });
      return;
    }

    const embed = {
      author: { name: 'Server Messages' },
      color: 0x00ae86,
      fields: [
        {
          name: 'Server Join Message',
          value: 'The message to send when a member joins the server',
        },
        {
          name: 'Levelup Message',
          value: 'The message to send when a member gains a level',
        },
        {
          name: 'Role Assign Message',
          value: 'The message to send when a member gains a role, unless overridden',
        },
        {
          name: 'Role Deassign Message',
          value: 'The message to send when a member loses a role, unless overridden',
        },
      ],
    };

    await interaction.reply({
      embeds: [embed],
      components: await generateRows(interaction),
      ephemeral: true,
    });
  },
});

const clearButton = component({
  type: ComponentType.Button,
  async callback({ interaction }) {
    await interaction.reply({
      content: 'Which message do you want to clear?',
      components: [
        actionrow([
          {
            customId: clearMessageSelect.instanceId({ predicate: requireUser(interaction.user) }),
            type: ComponentType.StringSelect,
            placeholder: 'The message to clear',
            options: selectOptions,
          },
        ]),
      ],
      ephemeral: true,
    });
  },
});

const clearMessageSelect = component({
  type: ComponentType.StringSelect,
  async callback({ interaction }) {
    const clearItem = interaction.values[0] as ServerMessage;

    const model = await getGuildModel(interaction.guild);
    model.upsert({ [clearItem]: '' });

    await interaction.reply({ content: `Cleared \`${_prettifyId[clearItem]}\``, ephemeral: true });
  },
});

const messageSelect = component({
  type: ComponentType.StringSelect,
  async callback({ interaction }) {
    const editItem = interaction.values[0] as ServerMessage;
    await interaction.showModal(generateModal(editItem));
  },
});

const setModal = modal<{ message: ServerMessage }>({
  async callback({ interaction, data }) {
    const value = interaction.fields.getTextInputValue('msg-component-1');
    await interaction.deferReply({ ephemeral: true });

    const model = await getGuildModel(interaction.guild);
    model.upsert({ [data.message]: value });

    await interaction.followUp({
      content: `Set ${_prettifyId[data.message]}`,
      embeds: [new EmbedBuilder().setDescription(value).setColor('#4fd6c8')],
      ephemeral: true,
    });
  },
});

const selectOptions: readonly SelectMenuComponentOptionData[] = [
  { label: 'Server Join Message', value: 'serverJoinMessage' },
  { label: 'Levelup Message', value: 'levelupMessage' },
  { label: 'Default Role Assign Message', value: 'roleAssignMessage' },
  { label: 'Default Role Deassign Message', value: 'roleDeassignMessage' },
] satisfies { label: string; value: ServerMessage }[];
