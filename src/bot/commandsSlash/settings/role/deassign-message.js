const guildRoleModel = require('../../../models/guild/guildRoleModel.js');
const { Modal, TextInputComponent, showModal } = require('discord-modals');


module.exports.execute = async function(i) {
  const m = new Modal()
    .setCustomId(`commandsSlash/settings/role/deassign-message.js ${i.options.getRole('role').id}`)
    .setTitle('Deassign Message')
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
  const roleId = i.customId.split(' ')[1];
  const msg = await i.getTextInputValue('msg-component-1');
  await guildRoleModel.storage.set(i.guild, roleId, 'deassignMessage', msg);

  await i.deferReply({ ephemeral: true });
  i.followUp({
    content: `Set Deassignment Message for <@&${roleId}>`,
    embeds: [{ description: msg, color: '#4fd6c8' }],
    ephemeral: true,
  });
};