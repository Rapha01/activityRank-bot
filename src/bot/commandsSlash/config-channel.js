const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { ChannelType: { GuildText, GuildVoice } } = require('discord-api-types/v9');
const { oneLine } = require('common-tags');
const guildChannelModel = require('../models/guild/guildChannelModel.js');
const guildModel = require('../models/guild/guildModel.js');

module.exports.data = new SlashCommandBuilder()
  .setName('config-channel')
  .setDescription('Change a channel\'s settings!')
  .addChannelOption(o => o
    .setName('channel').setDescription('The channel to modify')
    .addChannelTypes([GuildText, GuildVoice]).setRequired(true));


const generateRow = (i, id, type, myChannel) => {
  const r = [
    new MessageButton().setLabel('No XP'),
    new MessageButton().setLabel('No Commands'),
    new MessageButton().setLabel('Command Only'),
  ];
  r[0].setCustomId(`commandsSlash/config-channel.js ${i.member.id} ${id} ${type} noXp`);
  r[0].setStyle(myChannel.noXp ? 'SUCCESS' : 'DANGER');

  r[1].setCustomId(`commandsSlash/config-channel.js ${i.member.id} ${id} ${type} noCommand`);
  r[1].setDisabled(Boolean(parseInt(i.guild.appData.commandOnlyChannel)));
  r[1].setStyle(myChannel.noCommand ? 'SUCCESS' : 'DANGER');
  r[1].setDisabled(type === 'GUILD_VOICE');
  if (r[1].disabled) r[1].setStyle('SECONDARY');

  r[2].setCustomId(`commandsSlash/config-channel.js ${i.member.id} ${id} ${type} commandOnly`);
  r[2].setStyle(i.guild.appData.commandOnlyChannel == id ? 'SUCCESS' : 'DANGER');
  r[2].setDisabled(type === 'GUILD_VOICE');
  if (r[2].disabled) r[2].setStyle('SECONDARY');

  return r;
};

const _close = (i) => new MessageActionRow()
  .addComponents(new MessageButton()
    .setLabel('Close')
    .setStyle('DANGER')
    .setCustomId(`commandsSlash/config-channel.js ${i.member.id} - - closeMenu`));

module.exports.execute = async (i) => {
  if (!i.member.permissionsIn(i.channel).has('MANAGE_GUILD')) {
    return i.reply({
      content: 'You need the permission to manage the server in order to use this command.',
      ephemeral: true,
    });
  }

  const channel = i.options.getChannel('channel');
  const myChannel = await guildChannelModel.storage.get(i.guild, channel.id);

  const e = new MessageEmbed()
    .setAuthor({ name: 'Channel Settings' })
    .setDescription(channel.toString()).setColor(0x00AE86)
    .addField('No XP', 'If this is enabled, no xp will be given in this channel.');

  if (channel.type == 'GUILD_TEXT') {
    e.addField('No Commands', 'If this is enabled, commands not work in this channel.');
    e.addField('Command Only',
      oneLine`If this is enabled, this will be the **only channel commands will work in**, 
      unless you have the \`manage server\` permission.`);
  }

  i.reply({
    embeds: [e],
    components: [new MessageActionRow().addComponents(generateRow(i, channel.id, channel.type, myChannel)), _close(i)],
  });

};

module.exports.component = async (i) => {
  const [, memberId, channelId, channelType, type] = i.customId.split(' ');

  if (memberId !== i.member.id)
    return i.reply({ content: 'Sorry, this menu isn\'t for you.', ephemeral: true });

  if (type === 'closeMenu')
    return await i.message.delete();

  const myChannel = await guildChannelModel.storage.get(i.guild, channelId);

  if (['noXp', 'noCommand'].includes(type)) {
    if (myChannel[type]) {
      await guildChannelModel.storage.set(i.guild, channelId, type, 0);
      myChannel[type] = 0;
    } else {
      await guildChannelModel.storage.set(i.guild, channelId, type, 1);
      myChannel[type] = 1;
    }
  } else {
    // eslint-disable-next-line no-lonely-if
    if (i.guild.appData.commandOnlyChannel == channelId) await guildModel.storage.set(i.guild, 'commandOnlyChannel', 0);
    else await guildModel.storage.set(i.guild, 'commandOnlyChannel', channelId);
  }

  await i.update({ components: [
    new MessageActionRow().addComponents(generateRow(i, channelId, channelType, myChannel)), _close(i)] });
};
