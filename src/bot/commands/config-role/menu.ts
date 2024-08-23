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

import guildRoleModel from '../../models/guild/guildRoleModel.js';
import nameUtil from '../../util/nameUtil.js';
import { ParserResponseStatus, parseRole } from '../../util/parser.js';
import type { GuildRoleSchema } from 'models/types/shard.js';
import { subcommand } from 'bot/util/registry/command.js';
import { actionrow, closeButton } from 'bot/util/component.js';
import { component, modal } from 'bot/util/registry/component.js';
import { requireUser } from 'bot/util/predicates.js';

type AssignType = 'assignMessage' | 'deassignMessage';

const generateMainRow = (
  interaction: Interaction<'cached'>,
  roleId: string,
  myRole: GuildRoleSchema,
) => {
  const predicate = requireUser(interaction.user);
  return actionrow([
    {
      label: 'No XP',
      customId: noXpButton.instanceId({ data: { roleId }, predicate }),
      style: myRole.noXp ? ButtonStyle.Success : ButtonStyle.Danger,
      type: ComponentType.Button,
    },
    {
      label: 'Assignment Message',
      customId: modalButton.instanceId({ data: { roleId, type: 'assignMessage' }, predicate }),
      style: ButtonStyle.Secondary,
      type: ComponentType.Button,
    },
    {
      label: 'Deassignment Message',
      customId: modalButton.instanceId({ data: { roleId, type: 'deassignMessage' }, predicate }),
      style: ButtonStyle.Secondary,
      type: ComponentType.Button,
    },
  ]);
};

const generateCloseRow = (interaction: Interaction<'cached'>, roleId: string) =>
  actionrow([
    {
      label: 'Clear a message',
      style: ButtonStyle.Danger,
      customId: clearButton.instanceId({
        data: { roleId },
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

const _modal = (roleId: string, type: AssignType) =>
  new ModalBuilder()
    .setCustomId(messageModal.instanceId({ data: { type, roleId } }))
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
      },
      {
        name: 'id',
        description: 'The ID of the role to modify.',
        type: ApplicationCommandOptionType.String,
        min_length: 17,
        max_length: 20,
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

    const resolvedRole = parseRole(interaction);
    if (resolvedRole.status === ParserResponseStatus.ConflictingInputs) {
      await interaction.reply({
        content: `You have specified both a role and an ID, but they don't match.\nDid you mean: "/config-role menu role:${interaction.options.get('role')!.value}"?`,
        ephemeral: true,
      });
      return;
    } else if (resolvedRole.status === ParserResponseStatus.NoInput) {
      await interaction.reply({
        content: "You need to specify either a role or a role's ID!",
        ephemeral: true,
      });
      return;
    }

    const myRole = await guildRoleModel.storage.get(interaction.guild, resolvedRole.id);

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
        generateMainRow(interaction, resolvedRole.id, myRole),
        generateCloseRow(interaction, resolvedRole.id),
      ],
    });
  },
});

const clearButton = component<{ roleId: string }>({
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
              data: { roleId: data.roleId, type: 'assignMessage' },
            }),
            type: ComponentType.Button,
          },
          {
            label: 'Deassignment Message',
            style: ButtonStyle.Secondary,
            customId: unsetMessageButton.instanceId({
              data: { roleId: data.roleId, type: 'deassignMessage' },
            }),
            type: ComponentType.Button,
          },
        ]),
      ],
      ephemeral: true,
    });
  },
});

const unsetMessageButton = component<{ roleId: string; type: AssignType }>({
  type: ComponentType.Button,
  async callback({ interaction, data }) {
    await interaction.deferReply({ ephemeral: true });

    await guildRoleModel.storage.set(interaction.guild, data.roleId, data.type, '');

    const prettyType = data.type === 'assignMessage' ? 'Assignment' : 'Deassignment';

    await interaction.editReply({ content: `Unset ${prettyType} Message for <@&${data.roleId}>` });
  },
});

const noXpButton = component<{ roleId: string }>({
  type: ComponentType.Button,
  async callback({ interaction, data, drop }) {
    const myRole = await guildRoleModel.storage.get(interaction.guild, data.roleId);

    if (myRole.noXp) {
      await guildRoleModel.storage.set(interaction.guild, data.roleId, 'noXp', 0);
      myRole.noXp = 0;
    } else {
      await guildRoleModel.storage.set(interaction.guild, data.roleId, 'noXp', 1);
      myRole.noXp = 1;
    }
    await interaction.update({
      components: [
        generateMainRow(interaction, data.roleId, myRole),
        generateCloseRow(interaction, data.roleId),
      ],
    });

    drop();
  },
});

const modalButton = component<{ roleId: string; type: AssignType }>({
  type: ComponentType.Button,
  async callback({ interaction, data }) {
    await interaction.showModal(_modal(data.roleId, data.type));
  },
});

const messageModal = modal<{ type: AssignType; roleId: string }>({
  async callback({ interaction, data }) {
    const { roleId, type } = data;
    const value = interaction.fields.getTextInputValue('msg-component-1');
    await guildRoleModel.storage.set(interaction.guild, roleId, type, value);

    await interaction.deferReply({ ephemeral: true });
    await interaction.followUp({
      content: `Set ${
        type === 'assignMessage' ? 'Assignment' : 'Deassignment'
      } Message for <@&${roleId}>`,
      embeds: [new EmbedBuilder().setDescription(value).setColor('#4fd6c8')],
      ephemeral: true,
    });
  },
});
