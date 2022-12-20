const {
  SlashCommandBuilder,
  ActionRowBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType: { GuildText, GuildVoice, GuildCategory, GuildForum },
  PermissionFlagsBits,
  ChannelType,
} = require('discord.js');
const { oneLine, stripIndent } = require('common-tags');
const guildChannelModel = require('../models/guild/guildChannelModel.js');
const guildModel = require('../models/guild/guildModel.js');
const nameUtil = require('../util/nameUtil.js');
const { parseChannel } = require('../util/parser');

module.exports.data = new SlashCommandBuilder()
  .setName('config-channel')
  .setDescription("Change a channel's settings!")
  .addChannelOption((o) =>
    o
      .setName('channel')
      .setDescription('The channel to modify')
      .addChannelTypes(GuildText, GuildVoice, GuildForum)
  )
  .addStringOption((o) =>
    o.setName('id').setDescription('The ID of the channel to modify')
  );

const generateRow = (i, id, type, myChannel) => {
  const r = [
    new ButtonBuilder().setLabel('No XP'),
    new ButtonBuilder().setLabel('No Commands'),
    new ButtonBuilder().setLabel('Command Only'),
    new ButtonBuilder().setLabel('Server Join Channel'),
    new ButtonBuilder().setLabel('Levelup Channel'),
  ];
  r[0].setCustomId(
    `commandsSlash/config-channel.js ${i.member.id} ${id} ${type} noXp`
  );
  r[0].setStyle(myChannel.noXp ? ButtonStyle.Success : ButtonStyle.Danger);

  r[1].setCustomId(
    `commandsSlash/config-channel.js ${i.member.id} ${id} ${type} noCommand`
  );
  r[1].setDisabled(Boolean(parseInt(i.guild.appData.commandOnlyChannel)));
  r[1].setStyle(myChannel.noCommand ? ButtonStyle.Success : ButtonStyle.Danger);
  r[1].setDisabled(parseInt(type) !== ChannelType.GuildText);
  if (r[1].disabled) r[1].setStyle(ButtonStyle.Secondary);

  r[2].setCustomId(
    `commandsSlash/config-channel.js ${i.member.id} ${id} ${type} commandOnlyChannel`
  );
  r[2].setDisabled(parseInt(type) !== ChannelType.GuildText);
  r[2].setStyle(
    i.guild.appData.commandOnlyChannel == id
      ? ButtonStyle.Success
      : ButtonStyle.Danger
  );
  if (r[2].disabled) r[2].setStyle(ButtonStyle.Secondary);

  r[3].setCustomId(
    `commandsSlash/config-channel.js ${i.member.id} ${id} ${type} autopost_serverJoin`
  );
  r[3].setDisabled(parseInt(type) !== ChannelType.GuildText);
  r[3].setStyle(
    i.guild.appData.autopost_serverJoin == id
      ? ButtonStyle.Success
      : ButtonStyle.Danger
  );
  if (r[3].disabled) r[3].setStyle(ButtonStyle.Secondary);

  r[4].setCustomId(
    `commandsSlash/config-channel.js ${i.member.id} ${id} ${type} autopost_levelup`
  );
  r[4].setDisabled(parseInt(type) !== ChannelType.GuildText);
  r[4].setStyle(
    i.guild.appData.autopost_levelup == id
      ? ButtonStyle.Success
      : ButtonStyle.Danger
  );
  if (r[4].disabled) r[4].setStyle(ButtonStyle.Secondary);

  return r;
};

const _close = (i) =>
  new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel('Close')
      .setStyle(ButtonStyle.Danger)
      .setCustomId(
        `commandsSlash/config-channel.js ${i.member.id} - - closeMenu`
      )
  );

module.exports.execute = async (i) => {
  const resolvedChannel = await parseChannel(i);

  if (!resolvedChannel) {
    return await i.reply({
      content: "You need to specify either a channel or a channel's ID!",
      ephemeral: true,
    });
  }

  if (!i.member.permissionsIn(i.channel).has(PermissionFlagsBits.ManageGuild)) {
    return await i.reply({
      content:
        'You need the permission to manage the server in order to use this command.',
      ephemeral: true,
    });
  }

  const myChannel = await guildChannelModel.storage.get(
    i.guild,
    resolvedChannel.id
  );

  const e = new EmbedBuilder()
    .setAuthor({ name: 'Channel Settings' })
    .setDescription(
      nameUtil.getChannelMention(i.guild.channels.cache, resolvedChannel.id)
    )
    .setColor(0x00ae86)
    .addFields({
      name: 'No XP',
      value: 'If this is enabled, no xp will be given in this channel.',
    });

  if (
    !resolvedChannel.channel ||
    [ChannelType.GuildText, ChannelType.GuildForum].includes(
      resolvedChannel.channel.type
    )
  ) {
    e.addFields({
      name: 'No Commands',
      value: stripIndent`If this is enabled, commands will not work in this channel.
    **Note:** It is recommended to use the Discord native system in \`Server Settings -> Integrations -> ActivityRank\`.`,
    });
    e.addFields({
      name: 'Command Only',
      value: oneLine`If this is enabled, this will be the **only channel commands will work in**,
        unless you have the \`manage server\` permission.`,
    });
    e.addFields({
      name: 'Server Join Channel',
      value:
        'If this is enabled, server join messages will be sent to this channel.',
    });
    e.addFields({
      name: 'Levelup Channel',
      value:
        'If this is enabled, levelup messages will be sent to this channel.',
    });
  }

  await i.reply({
    embeds: [e],
    components: [
      new ActionRowBuilder().addComponents(
        generateRow(
          i,
          resolvedChannel.id,
          resolvedChannel.channel
            ? resolvedChannel.channel.type.toString()
            : '0',
          myChannel
        )
      ),
      _close(i),
    ],
  });
};

module.exports.component = async (i) => {
  const [, memberId, channelId, channelType, type] = i.customId.split(' ');

  if (memberId !== i.member.id)
    return await i.reply({
      content: "Sorry, this menu isn't for you.",
      ephemeral: true,
    });

  if (type === 'closeMenu') {
    await i.deferUpdate();
    return await i.deleteReply();
  }

  let myChannel = await guildChannelModel.storage.get(i.guild, channelId);

  if (['noXp', 'noCommand'].includes(type)) {
    if (myChannel[type])
      await guildChannelModel.storage.set(i.guild, channelId, type, 0);
    else await guildChannelModel.storage.set(i.guild, channelId, type, 1);

    myChannel = await guildChannelModel.storage.get(i.guild, channelId);
  } else {
    // eslint-disable-next-line no-lonely-if
    if (i.guild.appData[type] == channelId)
      await guildModel.storage.set(i.guild, type, 0);
    else await guildModel.storage.set(i.guild, type, channelId);
  }

  await i.update({
    components: [
      new ActionRowBuilder().addComponents(
        generateRow(i, channelId, channelType, myChannel)
      ),
      _close(i),
    ],
  });
};
