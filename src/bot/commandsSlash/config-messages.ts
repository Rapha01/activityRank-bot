import {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  StringSelectMenuBuilder,
  EmbedBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionFlagsBits,
  type Interaction,
} from 'discord.js';

import guildModel from '../models/guild/guildModel.js';
import { registerComponent, registerModal, registerSlashCommand } from 'bot/util/commandLoader.js';
import { ComponentType } from 'discord.js';

const generateRows = async (interaction: Interaction<'cached'>) => {
  return [
    new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(editSelectId(null, { ownerId: interaction.user.id }))
        .setPlaceholder('The message to set')
        .setOptions([
          { label: 'Server Join Message', value: 'serverJoinMessage' },
          { label: 'Levelup Message', value: 'levelupMessage' },
          { label: 'Default Role Assign Message', value: 'roleAssignMessage' },
          { label: 'Default Role Deassign Message', value: 'roleDeassignMessage' },
        ] satisfies { label: string; value: ServerMessage }[]),
    ),
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel('Clear a message')
        .setStyle(ButtonStyle.Danger)
        .setCustomId(clearBtnId(null, { ownerId: interaction.user.id })),
    ),
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

const _modal = (message: ServerMessage) =>
  new ModalBuilder()
    .setCustomId(setModalId({ message }))
    .setTitle('Message Selection')
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('msg-component-1')
          .setLabel(`The ${_prettifyId[message]}`)
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(message === 'levelupMessage' ? 1000 : 500)
          .setRequired(true),
      ),
    );

registerSlashCommand({
  data: new SlashCommandBuilder()
    .setName('config-messages')
    .setDescription("Configures the guild's autopost messages"),
  async execute(interaction) {
    if (
      !interaction.member.permissionsIn(interaction.channel!).has(PermissionFlagsBits.ManageGuild)
    ) {
      return await interaction.reply({
        content: 'You need the permission to manage the server in order to use this command.',
        ephemeral: true,
      });
    }

    const e = new EmbedBuilder()
      .setAuthor({ name: 'Server Messages' })
      .setColor(0x00ae86)
      .addFields(
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
      );

    await interaction.reply({
      embeds: [e],
      components: await generateRows(interaction),
      ephemeral: true,
    });
  },
});

const clearBtnId = registerComponent({
  identifier: 'config-messages.open-clearmenu',
  type: ComponentType.Button,
  async callback({ interaction }) {
    await interaction.reply({
      content: 'Which message do you want to clear?',
      components: [
        new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(clearMsgId(null, { ownerId: interaction.user.id }))
            .setPlaceholder('The message to clear')
            .setOptions([
              { label: 'Server Join Message', value: 'serverJoinMessage' },
              { label: 'Levelup Message', value: 'levelupMessage' },
              { label: 'Default Role Assign Message', value: 'roleAssignMessage' },
              { label: 'Default Role Deassign Message', value: 'roleDeassignMessage' },
            ] satisfies { label: string; value: ServerMessage }[]),
        ),
      ],
      ephemeral: true,
    });
  },
});

const clearMsgId = registerComponent({
  identifier: 'config-messages.clear-message',
  type: ComponentType.StringSelect,
  async callback({ interaction }) {
    const clearItem = interaction.values[0] as ServerMessage;
    await guildModel.storage.set(interaction.guild, clearItem, '');

    await interaction.reply({ content: `Cleared \`${_prettifyId[clearItem]}\``, ephemeral: true });
  },
});

const editSelectId = registerComponent({
  identifier: 'config-messages.edit-message',
  type: ComponentType.StringSelect,
  async callback({ interaction }) {
    const editItem = interaction.values[0] as ServerMessage;
    await interaction.showModal(_modal(editItem));
  },
});

const setModalId = registerModal<{ message: ServerMessage }>({
  identifier: 'config-messages.set',
  async callback({ interaction, data }) {
    const value = interaction.fields.getTextInputValue('msg-component-1');
    await interaction.deferReply({ ephemeral: true });

    await guildModel.storage.set(interaction.guild, data.message, value);

    await interaction.followUp({
      content: `Set ${_prettifyId[data.message]}`,
      embeds: [new EmbedBuilder().setDescription(value).setColor('#4fd6c8')],
      ephemeral: true,
    });
  },
});
