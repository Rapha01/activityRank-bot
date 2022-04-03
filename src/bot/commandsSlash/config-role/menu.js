const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
// const { oneLine } = require('common-tags');
const guildRoleModel = require('../../models/guild/guildRoleModel.js');
const { Modal, TextInputComponent, showModal } = require('discord-modals');


const generateRow = (i, id, myRole) => {
  const r = [
    new MessageButton().setLabel('No XP'),
    new MessageButton().setLabel('Assignment Message'),
    new MessageButton().setLabel('Deassignment Message'),
  ];
  r[0].setCustomId(`commandsSlash/config-role/menu.js ${i.member.id} ${id} noXp`);
  r[0].setStyle(myRole.noXp ? 'SUCCESS' : 'DANGER');

  r[1].setCustomId(`commandsSlash/config-role/menu.js ${i.member.id} ${id} assignMessage`);
  r[1].setStyle('SECONDARY');

  r[2].setCustomId(`commandsSlash/config-role/menu.js ${i.member.id} ${id} deassignMessage`);
  r[2].setStyle('SECONDARY');

  return r;
};

const _close = (i) => new MessageActionRow()
  .addComponents(new MessageButton()
    .setLabel('Close')
    .setStyle('DANGER')
    .setCustomId(`commandsSlash/config-role/menu.js ${i.member.id} - closeMenu`));

const _modal = (roleId, assignState) => new Modal()
  .setCustomId(`commandsSlash/config-role/menu.js ${roleId} ${assignState ? 'assignMessage' : 'deassignMessage'}`)
  .setTitle(`${assignState ? 'Assignment' : 'Deassignment'} Message`)
  .addComponents([
    new TextInputComponent()
      .setCustomId('msg-component-1')
      .setLabel(`The message to send upon ${assignState ? 'assignment' : 'deassignment'}`)
      .setStyle('LONG')
      .setMaxLength(1000)
      .setRequired(true),
  ]);

module.exports.execute = async (i) => {
  if (!i.member.permissionsIn(i.channel).has('MANAGE_GUILD')) {
    return i.reply({
      content: 'You need the permission to manage the server in order to use this command.',
      ephemeral: true,
    });
  }

  const role = i.options.getRole('role');
  const myRole = await guildRoleModel.storage.get(i.guild, role.id);

  const e = new MessageEmbed()
    .setAuthor({ name: 'Role Settings' })
    .setDescription(role.toString()).setColor(0x00AE86)
    .addField('No XP', 'If this is enabled, no xp will be given to members that have this role.')
    .addField('Assign Message',
      'This is the message sent when this role is given to a member. Defaults to the global assignMessage.')
    .addField('Deassign Message',
      'This is the message sent when this role is removed from a member. Defaults to the global deassignMessage.');

  i.reply({
    embeds: [e],
    components: [new MessageActionRow().addComponents(generateRow(i, role.id, myRole)), _close(i)],
  });

};

module.exports.component = async (i) => {
  const [, memberId, roleId, type] = i.customId.split(' ');

  if (memberId !== i.member.id)
    return i.reply({ content: 'Sorry, this menu isn\'t for you.', ephemeral: true });

  if (type === 'closeMenu')
    return await i.message.delete();

  const myRole = await guildRoleModel.storage.get(i.guild, roleId);

  if (type === 'noXp') {
    if (myRole.noXp) {
      await guildRoleModel.storage.set(i.guild, roleId, 'noXp', 0);
      myRole.noXp = 0;
    } else {
      await guildRoleModel.storage.set(i.guild, roleId, 'noXp', 1);
      myRole.noXp = 1;
    }
    await i.update({ components: [
      new MessageActionRow().addComponents(generateRow(i, roleId, myRole)), _close(i)] });
  } else {
    showModal(_modal(roleId, type === 'assignMessage'), { client: i.client, interaction: i });
  }

};

module.exports.modal = async (i) => {
  console.log(i.customId.split(' '));
  const [, roleId, type] = i.customId.split(' ');
  const value = await i.getTextInputValue('msg-component-1');
  await guildRoleModel.storage.set(i.guild, roleId, type, value);

  await i.deferReply({ ephemeral: true });
  i.followUp({
    content: `Set ${type === 'assignMessage' ? 'Assignment' : 'Deassignment'} Message for <@&${roleId}>`,
    embeds: [{ description: value, color: '#4fd6c8' }],
    ephemeral: true,
  });
};
