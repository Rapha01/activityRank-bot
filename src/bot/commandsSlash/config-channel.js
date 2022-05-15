const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { ChannelType: { GuildText, GuildVoice } } = require('discord-api-types/v9');
const { oneLine } = require('common-tags');
const guildChannelModel = require('../models/guild/guildChannelModel.js');
const guildModel = require('../models/guild/guildModel.js');
const nameUtil = require('../util/nameUtil.js');
const { parseChannel } = require('../util/parser');
const { channelTypes } = require('../util/constants');

module.exports.data = new SlashCommandBuilder()
  .setName('config-channel')
  .setDescription('Change a channel\'s settings!')
  .addChannelOption(o => o
    .setName('channel').setDescription('The channel to modify')
    .addChannelTypes([GuildText, GuildVoice]))
  .addStringOption(o => o
    .setName('id').setDescription('The ID of the channel to modify'));


const generateRow = (i, id, type, myChannel) => {
  console.log(myChannel);
  const r = [
    new MessageButton().setLabel('No XP'),
    new MessageButton().setLabel('No Commands'),
    new MessageButton().setLabel('Command Only'),
    new MessageButton().setLabel('Server Join Channel'),
    new MessageButton().setLabel('Levelup Channel'),
  ];
  r[0].setCustomId(`commandsSlash/config-channel.js ${i.member.id} ${id} ${type} noXp`);
  r[0].setStyle(myChannel.noXp ? 'SUCCESS' : 'DANGER');

  r[1].setCustomId(`commandsSlash/config-channel.js ${i.member.id} ${id} ${type} noCommand`);
  r[1].setDisabled(Boolean(parseInt(i.guild.appData.commandOnlyChannel)));
  r[1].setStyle(myChannel.noCommand ? 'SUCCESS' : 'DANGER');
  r[1].setDisabled(type === '2');
  if (r[1].disabled) r[1].setStyle('SECONDARY');

  r[2].setCustomId(`commandsSlash/config-channel.js ${i.member.id} ${id} ${type} commandOnlyChannel`);
  r[2].setStyle(i.guild.appData.commandOnlyChannel == id ? 'SUCCESS' : 'DANGER');
  r[2].setDisabled(type === '2');
  if (r[2].disabled) r[2].setStyle('SECONDARY');

  r[3].setCustomId(`commandsSlash/config-channel.js ${i.member.id} ${id} ${type} autopost_serverJoin`);
  r[3].setDisabled(type === '2');
  r[3].setStyle(i.guild.appData.autopost_serverJoin == id ? 'SUCCESS' : 'DANGER');
  if (r[3].disabled) r[3].setStyle('SECONDARY');


  r[4].setCustomId(`commandsSlash/config-channel.js ${i.member.id} ${id} ${type} autopost_levelup`);
  r[4].setDisabled(type === '2');
  r[4].setStyle(i.guild.appData.autopost_levelup == id ? 'SUCCESS' : 'DANGER');
  if (r[4].disabled) r[4].setStyle('SECONDARY');

  return r;
};

const _close = (i) => new MessageActionRow()
  .addComponents(new MessageButton()
    .setLabel('Close')
    .setStyle('DANGER')
    .setCustomId(`commandsSlash/config-channel.js ${i.member.id} - - closeMenu`));

module.exports.execute = async (i) => {
  const resolvedChannel = await parseChannel(i);

  if (!resolvedChannel)
    return await i.reply({
      content: 'You need to specify either a channel or a channel\'s ID!',
      ephemeral: true,
    });

  /* const cid = i.options.get('channel')?.value || i.options.get('id')?.value;
  if (!cid) {
    return await i.reply({
      content: 'You need to specify either a channel or a channel\'s ID!',
      ephemeral: true,
    });
  }
  if (!sf().test(cid)) {
    return await i.reply({
      content: 'The `id` field must be a valid snowflake!',
      ephemeral: true,
    });
  }
  const channel = i.guild.channels.cache.get(cid); */
  if (!i.member.permissionsIn(i.channel).has('MANAGE_GUILD'))
    return await i.reply({
      content: 'You need the permission to manage the server in order to use this command.',
      ephemeral: true,
    });


  const myChannel = await guildChannelModel.storage.get(i.guild, resolvedChannel.id);

  const e = new MessageEmbed()
    .setAuthor({ name: 'Channel Settings' })
    .setDescription(nameUtil.getChannelMention(i.guild.channels.cache, resolvedChannel.id)).setColor(0x00AE86)
    .addField('No XP', 'If this is enabled, no xp will be given in this channel.');

  if (!resolvedChannel.channel || resolvedChannel.channel.type === 'GUILD_TEXT') {
    e.addField('No Commands', 'If this is enabled, commands will not work in this channel.');
    e.addField('Command Only',
      oneLine`If this is enabled, this will be the **only channel commands will work in**,
      unless you have the \`manage server\` permission.`);
    e.addField('Server Join Channel', 'If this is enabled, server join messages will be sent to this channel.');
    e.addField('Levelup Channel', 'If this is enabled, levelup messages will be sent to this channel.');
  }

  await i.reply({
    embeds: [e],
    components: [
      new MessageActionRow().addComponents(
        generateRow(i,
          resolvedChannel.id,
          resolvedChannel.channel ? channelTypes.indexOf(resolvedChannel.channel.type).toString() : '0',
          myChannel)),
      _close(i),
    ],
  });

};

module.exports.component = async (i) => {
  const [, memberId, channelId, channelType, type] = i.customId.split(' ');

  if (memberId !== i.member.id)
    return await i.reply({ content: 'Sorry, this menu isn\'t for you.', ephemeral: true });

  if (type === 'closeMenu')
    return await i.message.delete();

  let myChannel = await guildChannelModel.storage.get(i.guild, channelId);

  if (['noXp', 'noCommand'].includes(type)) {
    if (myChannel[type])
      await guildChannelModel.storage.set(i.guild, channelId, type, 0);
    else
      await guildChannelModel.storage.set(i.guild, channelId, type, 1);

    myChannel = await guildChannelModel.storage.get(i.guild, channelId);
  } else {
    // eslint-disable-next-line no-lonely-if
    if (i.guild.appData[type] == channelId) await guildModel.storage.set(i.guild, type, 0);
    else await guildModel.storage.set(i.guild, type, channelId);
  }

  await i.update({ components: [
    new MessageActionRow().addComponents(generateRow(i, channelId, channelType, myChannel)), _close(i)] });
};
