import {
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionFlagsBits,
} from 'discord.js';

import guildRoleModel from '../../models/guild/guildRoleModel.js';
import nameUtil from '../../util/nameUtil.js';
import { parseRole } from '../../util/parser';

const generateRow = (i, id, myRole) => {
  const r = [
    new ButtonBuilder().setLabel('No XP'),
    new ButtonBuilder().setLabel('Assignment Message'),
    new ButtonBuilder().setLabel('Deassignment Message'),
  ];
  r[0].setCustomId(`config-role/menu ${i.member.id} ${id} noXp`);
  r[0].setStyle(myRole.noXp ? ButtonStyle.Success : ButtonStyle.Danger);

  r[1].setCustomId(`config-role/menu ${i.member.id} ${id} assignMessage`);
  r[1].setStyle(ButtonStyle.Secondary);

  r[2].setCustomId(`config-role/menu ${i.member.id} ${id} deassignMessage`);
  r[2].setStyle(ButtonStyle.Secondary);

  return r;
};

const _close = (i) =>
  new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel('Close')
      .setStyle(ButtonStyle.Danger)
      .setCustomId(`config-role/menu ${i.member.id} - closeMenu`)
  );

const _modal = (roleId, assignState) =>
  new ModalBuilder()
    .setCustomId(
      `config-role/menu ${roleId} ${
        assignState ? 'assignMessage' : 'deassignMessage'
      }`
    )
    .setTitle(`${assignState ? 'Assignment' : 'Deassignment'} Message`)
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('msg-component-1')
          .setLabel(
            `The message to send upon ${
              assignState ? 'assignment' : 'deassignment'
            }`
          )
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(1000)
          .setRequired(true)
      )
    );

export const execute = async (i) => {
  if (!i.member.permissionsIn(i.channel).has(PermissionFlagsBits.ManageGuild)) {
    return await i.reply({
      content:
        'You need the permission to manage the server in order to use this command.',
      ephemeral: true,
    });
  }

  const resolvedRole = await parseRole(i);

  if (!resolvedRole) {
    return await i.reply({
      content: "You need to specify either a role or a role's ID!",
      ephemeral: true,
    });
  }

  const myRole = await guildRoleModel.storage.get(i.guild, resolvedRole.id);

  const e = new EmbedBuilder()
    .setAuthor({ name: 'Role Settings' })
    .setDescription(
      nameUtil.getRoleMention(i.guild.roles.cache, resolvedRole.id)
    )
    .setColor(0x00ae86)
    .addFields(
      {
        name: 'No XP',
        value:
          'If this is enabled, no xp will be given to members that have this role.',
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
      }
    );

  await i.reply({
    embeds: [e],
    components: [
      new ActionRowBuilder().addComponents(
        generateRow(i, resolvedRole.id, myRole)
      ),
      _close(i),
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('Clear a message')
          .setStyle(ButtonStyle.Danger)
          .setCustomId(
            `config-role/menu ${i.member.id} ${resolvedRole.id} clear`
          )
      ),
    ],
  });
};

export const component = async (i) => {
  const [, memberId, roleId, type] = i.customId.split(' ');

  if (memberId !== i.member.id)
    return await i.reply({
      content: "Sorry, this menu isn't for you.",
      ephemeral: true,
    });

  if (type === 'clear') {
    return await i.reply({
      content: 'Which message do you want to clear?',
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setLabel('Assignment Message')
            .setCustomId(
              `config-role/menu ${i.member.id} ${roleId} clear-assign`
            )
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setLabel('Deassignment Message')
            .setCustomId(
              `config-role/menu ${i.member.id} ${roleId} clear-deassign`
            )
            .setStyle(ButtonStyle.Secondary)
        ),
      ],
      ephemeral: true,
    });
  }

  if (['clear-assign', 'clear-deassign'].includes(type)) {
    await guildRoleModel.storage.set(
      i.guild,
      roleId,
      type === 'clear-assign' ? 'assignMessage' : 'deassignMessage',
      ''
    );

    await i.deferReply({ ephemeral: true });
    return await i.followUp({
      content: `Unset ${
        type === 'assignMessage' ? 'Assignment' : 'Deassignment'
      } Message for <@&${roleId}>`,
      ephemeral: true,
    });
  }

  if (type === 'closeMenu') {
    await i.deferUpdate();
    return await i.deleteReply();
  }

  const myRole = await guildRoleModel.storage.get(i.guild, roleId);

  if (type === 'noXp') {
    if (myRole.noXp) {
      await guildRoleModel.storage.set(i.guild, roleId, 'noXp', 0);
      myRole.noXp = 0;
    } else {
      await guildRoleModel.storage.set(i.guild, roleId, 'noXp', 1);
      myRole.noXp = 1;
    }
    await i.update({
      components: [
        new ActionRowBuilder().addComponents(generateRow(i, roleId, myRole)),
        _close(i),
      ],
    });
  } else {
    return await i.showModal(_modal(roleId, type === 'assignMessage'));
  }
};

export const modal = async (i) => {
  const [, roleId, type] = i.customId.split(' ');
  const value = await i.fields.getTextInputValue('msg-component-1');
  await guildRoleModel.storage.set(i.guild, roleId, type, value);

  await i.deferReply({ ephemeral: true });
  await i.followUp({
    content: `Set ${
      type === 'assignMessage' ? 'Assignment' : 'Deassignment'
    } Message for <@&${roleId}>`,
    embeds: [new EmbedBuilder().setDescription(value).setColor('#4fd6c8')],
    ephemeral: true,
  });
};
