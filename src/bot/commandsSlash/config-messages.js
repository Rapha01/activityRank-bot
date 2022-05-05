/* eslint-disable max-len */
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const { Modal, TextInputComponent, showModal } = require('discord-modals');
const guildModel = require('../models/guild/guildModel.js');

const generateRows = async (i) => {
  const r1 = [
    new MessageButton().setLabel('Server Join Message').setCustomId(`commandsSlash/config-messages.js ${i.member.id} serverJoinMessage`),
    new MessageButton().setLabel('Levelup Message').setCustomId(`commandsSlash/config-messages.js ${i.member.id} levelupMessage`),
    new MessageButton().setLabel('Role Assign Message').setCustomId(`commandsSlash/config-messages.js ${i.member.id} roleAssignMessage`),
    new MessageButton().setLabel('Role Deassign Message').setCustomId(`commandsSlash/config-messages.js ${i.member.id} roleDeassignMessage`),
  ];
  r1.forEach(o => o.setStyle('SECONDARY'));
  return [new MessageActionRow().addComponents(r1)];
};

const _prettifyId = {
  serverJoinMessage: 'Server Join Message',
  levelupMessage: 'Levelup Message',
  roleAssignMessage: 'Role Assign Message',
  roleDeasssignMessage: 'Role Deassign Message',
};

const _modal = (type) => new Modal()
  .setCustomId(`commandsSlash/config-messages.js ${type}`)
  .setTitle('Message Selection')
  .addComponents([
    new TextInputComponent()
      .setCustomId('msg-component-1')
      .setLabel(`The ${_prettifyId[type]}`)
      .setStyle('LONG')
      .setMaxLength(type === 'levelupMessage' ? 1000 : 500)
      .setRequired(true),
  ]);


module.exports.data = new SlashCommandBuilder()
  .setName('config-messages')
  .setDescription('Configures the guild\'s autopost messages');

module.exports.execute = async (i) => {
  if (!i.member.permissionsIn(i.channel).has('MANAGE_GUILD')) {
    return await i.reply({
      content: 'You need the permission to manage the server in order to use this command.',
      ephemeral: true,
    });
  }

  const e = new MessageEmbed()
    .setAuthor({ name: 'Server Messages' }).setColor(0x00AE86)
    .addField('Server Join Message',
      'The message to send when a member joins the server')
    .addField('Levelup Message',
      'The message to send when a member gains a level')
    .addField('Role Assign Message',
      'The message to send when a member gains a role, unless overridden')
    .addField('Role Deassign Message',
      'The message to send when a member loses a role, unless overridden');

  await i.reply({
    embeds: [e],
    components: await generateRows(i),
    ephemeral: true,
  });

};

module.exports.component = async (i) => {
  const [, memberId, type] = i.customId.split(' ');

  if (memberId !== i.member.id)
    return await i.reply({ content: 'Sorry, this menu isn\'t for you.', ephemeral: true });

  if (type === 'closeMenu')
    return await i.message.delete();

  showModal(_modal(type), { client: i.client, interaction: i });
};

module.exports.modal = async function(i) {
  const [, type] = i.customId.split(' ');
  const value = await i.getTextInputValue('msg-component-1');
  await guildModel.storage.set(i.guild, type, value);

  await i.deferReply({ ephemeral: true });
  await i.followUp({
    content: `Set ${_prettifyId[type]}`,
    embeds: [{ description: value, color: '#4fd6c8' }],
    ephemeral: true,
  });
};
