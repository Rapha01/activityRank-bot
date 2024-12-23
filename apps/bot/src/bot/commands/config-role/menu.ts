import {
  ButtonStyle,
  ActionRowBuilder,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionFlagsBits,
  ComponentType,
  type Interaction,
  ApplicationCommandOptionType,
  type APIEmbed,
} from 'discord.js';

import { getRoleModel, type RoleModel } from 'bot/models/guild/guildRoleModel.js';
import nameUtil from '../../util/nameUtil.js';
import { subcommand } from 'bot/util/registry/command.js';
import { actionrow, closeButton } from 'bot/util/component.js';
import { component, modal } from 'bot/util/registry/component.js';
import { requireUser } from 'bot/util/predicates.js';

type AssignType = 'assignMessage' | 'deassignMessage';

const generateMainRow = (interaction: Interaction<'cached'>, role: RoleModel) => {
  const predicate = requireUser(interaction.user);
  return actionrow([
    {
      label: 'No XP',
      customId: noXpButton.instanceId({ data: { role }, predicate }),
      style: role.db.noXp ? ButtonStyle.Success : ButtonStyle.Danger,
      type: ComponentType.Button,
    },
    {
      label: 'Assignment Message',
      customId: modalButton.instanceId({ data: { role, type: 'assignMessage' }, predicate }),
      style: ButtonStyle.Secondary,
      type: ComponentType.Button,
    },
    {
      label: 'Deassignment Message',
      customId: modalButton.instanceId({ data: { role, type: 'deassignMessage' }, predicate }),
      style: ButtonStyle.Secondary,
      type: ComponentType.Button,
    },
  ]);
};

const generateCloseRow = (interaction: Interaction<'cached'>, role: RoleModel) =>
  actionrow([
    {
      label: 'Clear a message',
      style: ButtonStyle.Danger,
      customId: clearButton.instanceId({
        data: { role },
        predicate: requireUser(interaction.user),
      }),
      type: ComponentType.Button,
    },

    {
      label: 'Close',
      style: ButtonStyle.Danger,
      customId: closeButton.instanceId({ predicate: requireUser(interaction.user) }),
      type: ComponentType.Button,
    },
  ]);

const _modal = (role: RoleModel, type: AssignType) =>
  new ModalBuilder()
    .setCustomId(messageModal.instanceId({ data: { type, role } }))
    .setTitle(`${type === 'assignMessage' ? 'Assignment' : 'Deassignment'} Message`)
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('msg-component-1')
          .setLabel(
            `The message to send upon ${type === 'assignMessage' ? 'assignment' : 'deassignment'}`,
          )
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(1000)
          .setRequired(true),
      ),
    );

export const menu = subcommand({
  data: {
    name: 'menu',
    description: 'Launches a menu to modify role settings.',
    type: ApplicationCommandOptionType.Subcommand,
    options: [
      {
        name: 'role',
        description: 'The role to modify.',
        type: ApplicationCommandOptionType.Role,
        required: true,
      },
    ],
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

    const resolvedRole = interaction.options.getRole('role', true);

    const cachedRole = await getRoleModel(resolvedRole);

    const embed: APIEmbed = {
      author: { name: 'Role Settings' },
      description: nameUtil.getRoleMention(interaction.guild.roles.cache, resolvedRole.id),
      color: 0x00ae86,
      fields: [
        {
          name: 'No XP',
          value: 'If this is enabled, no xp will be given to members that have this role.',
        },
        {
          name: 'Assign Message',
          value:
            'This is the message sent when this role is given to a member. Defaults to the global assignMessage.',
        },
        {
          name: 'Deassign Message',
          value:
            'This is the message sent when this role is removed from a member. Defaults to the global deassignMessage.',
        },
      ],
    };

    await interaction.reply({
      embeds: [embed],
      components: [
        generateMainRow(interaction, cachedRole),
        generateCloseRow(interaction, cachedRole),
      ],
    });
  },
});

const clearButton = component<{ role: RoleModel }>({
  type: ComponentType.Button,
  async callback({ interaction, data }) {
    await interaction.reply({
      content: 'Which message do you want to clear?',
      components: [
        actionrow([
          {
            label: 'Assignment Message',
            style: ButtonStyle.Secondary,
            customId: unsetMessageButton.instanceId({
              data: { role: data.role, type: 'assignMessage' },
            }),
            type: ComponentType.Button,
          },
          {
            label: 'Deassignment Message',
            style: ButtonStyle.Secondary,
            customId: unsetMessageButton.instanceId({
              data: { role: data.role, type: 'deassignMessage' },
            }),
            type: ComponentType.Button,
          },
        ]),
      ],
      ephemeral: true,
    });
  },
});

const unsetMessageButton = component<{ role: RoleModel; type: AssignType }>({
  type: ComponentType.Button,
  async callback({ interaction, data }) {
    await interaction.deferReply({ ephemeral: true });

    await data.role.upsert({ [data.type]: '' });

    const prettyType = data.type === 'assignMessage' ? 'Assignment' : 'Deassignment';

    await interaction.editReply({
      content: `Unset ${prettyType} Message for <@&${data.role.object.id}>`,
    });
  },
});

const noXpButton = component<{ role: RoleModel }>({
  type: ComponentType.Button,
  async callback({ interaction, data, drop }) {
    const myRole = await data.role.fetch();

    if (myRole.noXp) {
      await data.role.upsert({ noXp: 0 });
    } else {
      await data.role.upsert({ noXp: 1 });
    }
    await interaction.update({
      components: [
        generateMainRow(interaction, data.role),
        generateCloseRow(interaction, data.role),
      ],
    });

    drop();
  },
});

const modalButton = component<{ role: RoleModel; type: AssignType }>({
  type: ComponentType.Button,
  async callback({ interaction, data }) {
    await interaction.showModal(_modal(data.role, data.type));
  },
});

const messageModal = modal<{ type: AssignType; role: RoleModel }>({
  async callback({ interaction, data }) {
    const { role, type } = data;
    const value = interaction.fields.getTextInputValue('msg-component-1');
    await role.upsert({ [type]: value });

    await interaction.deferReply({ ephemeral: true });
    await interaction.followUp({
      content: `Set ${
        type === 'assignMessage' ? 'Assignment' : 'Deassignment'
      } Message for <@&${role.object.id}>`,
      embeds: [new EmbedBuilder().setDescription(value).setColor('#4fd6c8')],
      ephemeral: true,
    });
  },
});
