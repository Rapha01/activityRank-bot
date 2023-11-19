import {
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionFlagsBits,
  ComponentType,
  type Interaction,
} from 'discord.js';

import guildRoleModel from '../../models/guild/guildRoleModel.js';
import nameUtil from '../../util/nameUtil.js';
import { parseRole } from '../../util/parser.js';
import { registerComponent, registerModal, registerSubCommand } from 'bot/util/commandLoader.js';
import type { GuildRoleSchema } from 'models/types/shard.js';

type AssignType = 'assignMessage' | 'deassignMessage';

const generateRow = (i: Interaction<'cached'>, roleId: string, myRole: GuildRoleSchema) => {
  const r = [
    new ButtonBuilder().setLabel('No XP'),
    new ButtonBuilder().setLabel('Assignment Message'),
    new ButtonBuilder().setLabel('Deassignment Message'),
  ];

  r[0].setCustomId(noXPToggleId({ roleId }, { ownerId: i.user.id }));
  r[0].setStyle(myRole.noXp ? ButtonStyle.Success : ButtonStyle.Danger);

  r[1].setCustomId(modalLaunchId({ roleId, type: 'assignMessage' }, { ownerId: i.user.id }));
  r[1].setStyle(ButtonStyle.Secondary);

  r[1].setCustomId(modalLaunchId({ roleId, type: 'deassignMessage' }, { ownerId: i.user.id }));
  r[2].setStyle(ButtonStyle.Secondary);

  return r;
};

const _close = (interaction: Interaction<'cached'>) =>
  new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel('Close')
      .setStyle(ButtonStyle.Danger)
      .setCustomId(closeId(null, { ownerId: interaction.member.id })),
  );

const _modal = (roleId: string, assignState: boolean) =>
  new ModalBuilder()
    .setCustomId(modalId({ type: assignState ? 'assignMessage' : 'deassignMessage', roleId }))
    .setTitle(`${assignState ? 'Assignment' : 'Deassignment'} Message`)
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('msg-component-1')
          .setLabel(`The message to send upon ${assignState ? 'assignment' : 'deassignment'}`)
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(1000)
          .setRequired(true),
      ),
    );

registerSubCommand({
  async execute(interaction) {
    if (
      !interaction.member.permissionsIn(interaction.channel!).has(PermissionFlagsBits.ManageGuild)
    ) {
      return await interaction.reply({
        content: 'You need the permission to manage the server in order to use this command.',
        ephemeral: true,
      });
    }

    const resolvedRole = await parseRole(interaction);

    if (!resolvedRole) {
      return await interaction.reply({
        content: "You need to specify either a role or a role's ID!",
        ephemeral: true,
      });
    }

    const myRole = await guildRoleModel.storage.get(interaction.guild, resolvedRole.id);

    const e = new EmbedBuilder()
      .setAuthor({ name: 'Role Settings' })
      .setDescription(nameUtil.getRoleMention(interaction.guild.roles.cache, resolvedRole.id))
      .setColor(0x00ae86)
      .addFields(
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
      );

    await interaction.reply({
      embeds: [e],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          generateRow(interaction, resolvedRole.id, myRole),
        ),
        _close(interaction),
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setLabel('Clear a message')
            .setStyle(ButtonStyle.Danger)
            .setCustomId(
              clearDirectoryId({ roleId: resolvedRole.id }, { ownerId: interaction.member.id }),
            ),
        ),
      ],
    });
  },
});

const clearDirectoryId = registerComponent<{ roleId: string }>({
  identifier: 'config-role.menu.clear.directory',
  type: ComponentType.Button,
  async callback(interaction, data) {
    await interaction.reply({
      content: 'Which message do you want to clear?',
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setLabel('Assignment Message')
            .setCustomId(clearAssignId({ roleId: data.roleId, type: 'assignMessage' }))
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setLabel('Deassignment Message')
            .setCustomId(clearAssignId({ roleId: data.roleId, type: 'deassignMessage' }))
            .setStyle(ButtonStyle.Secondary),
        ),
      ],
      ephemeral: true,
    });
  },
});

const clearAssignId = registerComponent<{ roleId: string; type: AssignType }>({
  identifier: 'config-role.menu.clear',
  type: ComponentType.Button,
  async callback(interaction, data) {
    await interaction.deferReply({ ephemeral: true });

    await guildRoleModel.storage.set(interaction.guild, data.roleId, data.type, '');

    const prettyType = data.type === 'assignMessage' ? 'Assignment' : 'Deassignment';

    await interaction.editReply({ content: `Unset ${prettyType} Message for <@&${data.roleId}>` });
  },
});

const noXPToggleId = registerComponent<{ roleId: string }>({
  identifier: 'config-role.menu.noxptoggle',
  type: ComponentType.Button,
  async callback(interaction, data) {
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
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          generateRow(interaction, data.roleId, myRole),
        ),
        _close(interaction),
      ],
    });
  },
});

const modalLaunchId = registerComponent<{ roleId: string; type: AssignType }>({
  identifier: 'config-role.menu.launchmodal',
  type: ComponentType.Button,
  async callback(interaction, data) {
    await interaction.showModal(_modal(data.roleId, data.type === 'assignMessage'));
  },
});

// FIXME TODO: extract close into componentKeyss
const closeId = registerComponent({
  identifier: 'config-role.menu.close',
  type: ComponentType.Button,
  async callback(interaction) {
    await interaction.deferUpdate();
    await interaction.deleteReply();
  },
});

const modalId = registerModal<{ type: AssignType; roleId: string }>({
  identifier: 'config-role.menu.input',
  async callback(i, data) {
    const { roleId, type } = data;
    const value = i.fields.getTextInputValue('msg-component-1');
    await guildRoleModel.storage.set(i.guild, roleId, type, value);

    await i.deferReply({ ephemeral: true });
    await i.followUp({
      content: `Set ${
        type === 'assignMessage' ? 'Assignment' : 'Deassignment'
      } Message for <@&${roleId}>`,
      embeds: [new EmbedBuilder().setDescription(value).setColor('#4fd6c8')],
      ephemeral: true,
    });
  },
});
