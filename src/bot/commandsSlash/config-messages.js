/* eslint-disable max-len */
const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  SelectMenuBuilder,
  EmbedBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionFlagsBits,
  Embed,
} = require('discord.js');
const guildModel = require('../models/guild/guildModel.js');

const generateRows = async (i) => {
  return [
    new ActionRowBuilder().addComponents(
      new SelectMenuBuilder()
        .setCustomId(`commandsSlash/config-messages.js ${i.member.id} select`)
        .setPlaceholder('The message to set')
        .setOptions([
          { label: 'Server Join Message', value: 'serverJoinMessage' },
          { label: 'Levelup Message', value: 'levelupMessage' },
          { label: 'Default Role Assign Message', value: 'roleAssignMessage' },
          {
            label: 'Default Role Deassign Message',
            value: 'roleDeassignMessage',
          },
        ])
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Clear a message')
        .setStyle(ButtonStyle.Danger)
        .setCustomId(`commandsSlash/config-messages.js ${i.member.id} clear`)
    ),
  ];
};

const _prettifyId = {
  serverJoinMessage: 'Server Join Message',
  levelupMessage: 'Levelup Message',
  roleAssignMessage: 'Role Assign Message',
  roleDeasssignMessage: 'Role Deassign Message',
};

const _modal = (type) =>
  new ModalBuilder()
    .setCustomId(`commandsSlash/config-messages.js ${type}`)
    .setTitle('Message Selection')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('msg-component-1')
          .setLabel(`The ${_prettifyId[type]}`)
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(type === 'levelupMessage' ? 1000 : 500)
          .setRequired(true)
      )
    );

module.exports.data = new SlashCommandBuilder()
  .setName('config-messages')
  .setDescription("Configures the guild's autopost messages");

module.exports.execute = async (i) => {
  if (!i.member.permissionsIn(i.channel).has(PermissionFlagsBits.ManageGuild)) {
    return await i.reply({
      content:
        'You need the permission to manage the server in order to use this command.',
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
        value:
          'The message to send when a member gains a role, unless overridden',
      },
      {
        name: 'Role Deassign Message',
        value:
          'The message to send when a member loses a role, unless overridden',
      }
    );

  await i.reply({
    embeds: [e],
    components: await generateRows(i),
    ephemeral: true,
  });
};

module.exports.component = async (i) => {
  const [, memberId, type] = i.customId.split(' ');

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
          new SelectMenuBuilder()
            .setCustomId(
              `commandsSlash/config-messages.js ${i.member.id} clear-select`
            )
            .setPlaceholder('The message to clear')
            .setOptions([
              { label: 'Server Join Message', value: 'serverJoinMessage' },
              { label: 'Levelup Message', value: 'levelupMessage' },
              {
                label: 'Default Role Assign Message',
                value: 'roleAssignMessage',
              },
              {
                label: 'Default Role Deassign Message',
                value: 'roleDeassignMessage',
              },
            ])
        ),
      ],
      ephemeral: true,
    });
  }

  if (type === 'clear-select') {
    const clearItem = i.values[0];
    await guildModel.storage.set(i.guild, clearItem, '');

    return await i.reply({
      content: `Cleared \`${_prettifyId[clearItem]}\``,
      ephemeral: true,
    });
  }

  if (type === 'select') return await i.showModal(_modal(i.values[0]));
};

module.exports.modal = async function (i) {
  const [, type] = i.customId.split(' ');
  const value = i.fields.getTextInputValue('msg-component-1');
  await guildModel.storage.set(i.guild, type, value);

  await i.deferReply({ ephemeral: true });
  await i.followUp({
    content: `Set ${_prettifyId[type]}`,
    embeds: [new EmbedBuilder().setDescription(value).setColor('#4fd6c8')],
    ephemeral: true,
  });
};
