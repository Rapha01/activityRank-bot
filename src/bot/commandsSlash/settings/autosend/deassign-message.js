const guildModel = require('../../../models/guild/guildModel.js');
const { Modal, TextInputComponent, showModal } = require('discord-modals');


module.exports.execute = async function(i) {
  const m = new Modal()
    .setCustomId('commandsSlash/settings/autosend/deassign-message.js')
    .setTitle('Global Deassign Message')
    .addComponents([
      new TextInputComponent()
        .setCustomId('msg-component-1')
        .setLabel('The message to send upon deassignment')
        .setStyle('LONG')
        .setMaxLength(1000)
        .setRequired(true),
    ]);
  showModal(m, { client: i.client, interaction: i });
};

module.exports.modal = async function(i) {
  const msg = await i.getTextInputValue('msg-component-1');
  await guildModel.storage.set(i.guild, 'roleDeassignMessage', msg);

  await i.deferReply({ ephemeral: true });
  i.followUp({
    content: 'Set Deassignment Message for all messages without overrides',
    embeds: [{ description: msg, color: '#4fd6c8' }],
    ephemeral: true,
  });
};