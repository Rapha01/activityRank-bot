const guildMemberModel = require('../models/guild/guildMemberModel.js');
const guildModel = require('../models/guild/guildModel.js');
const rankModel = require('../models/rankModel.js');
const fct = require('../../util/fct.js');
const cooldownUtil = require('../util/cooldownUtil.js');
const nameUtil = require('../util/nameUtil.js');
const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ChannelSelectMenuBuilder,
  ChannelType,
} = require('discord.js');

const _prettifyTime = {
  Day: 'Today',
  Week: 'This week',
  Month: 'This month',
  Year: 'This year',
  Alltime: 'Forever',
};

module.exports.activeCache = new Map();

module.exports.data = new SlashCommandBuilder()
  .setName('top')
  .setDescription('Toplists for the server')
  .setDMPermission(false);

module.exports.execute = async (i) => {
  await i.deferReply();

  await guildModel.cache.load(i.guild);
  await guildMemberModel.cache.load(i.member);

  const myGuild = await guildModel.storage.get(i.guild);

  if (!(await cooldownUtil.checkStatCommandsCooldown(i))) return;

  const initialState = {
    window: 'members',
    time: 'Alltime',
    owner: i.member.id,
    page: 1,
    orderType: 'allScores',
    interaction: i,
  };

  const { id } = await i.editReply(
    await generate(initialState, i.guild, myGuild)
  );

  const cleanCache = async () => {
    const state = exports.activeCache.get(id);
    exports.activeCache.delete(id);
    if (!i.guild)
      return i.client.logger.debug(
        { i },
        '/top tried to update uncached guild'
      );
    try {
      await i.editReply(await generate(state, i.guild, myGuild, true));
    } catch (err) {
      if (err.code === 10008)
        // Unknown Message
        i.client.logger.debug({ i }, '/top tried to update Unknown message');
      else throw err;
    }
  };
  setTimeout(cleanCache, 5 * 60 * 1_000);

  exports.activeCache.set(id, initialState);
};

module.exports.component = async (i) => {
  const action = i.customId.split(' ')[1];
  let payload =
    i.customId.split(' ')[2] ?? i?.channels?.first() ?? i.values[0] ?? null;

  const cachedMessage = exports.activeCache.get(i.message.id);
  if (!cachedMessage) {
    i.client.logger.debug(
      { i, id: i.message.id },
      'Could not find cachedMessage'
    );
    return;
  }

  if (cachedMessage.owner !== i.user.id)
    return await i.reply({
      content: "Sorry, this menu isn't for you.",
      ephemeral: true,
    });

  const myGuild = await guildModel.storage.get(i.guild);

  if (action === 'page') payload = parseInt(payload);

  exports.activeCache.set(i.message.id, {
    ...cachedMessage,
    [action]: payload,
  });

  await i.deferUpdate();

  const state = exports.activeCache.get(i.message.id);
  await state.interaction.editReply(await generate(state, i.guild, myGuild));
};

async function generate(state, guild, myGuild, disabled = false) {
  if (state.window === 'channelMembers')
    return await generateChannelMembers(state, guild, myGuild, disabled);
  if (state.window === 'members')
    return await generateGuildMembers(state, guild, myGuild, disabled);
  if (state.window === 'channels')
    return await generateChannels(state, guild, myGuild, disabled);
}

async function generateChannels(state, guild, myGuild, disabled) {
  const page = fct.extractPageSimple(state.page ?? 1, myGuild.entriesPerPage);

  const header = `Toplist channels in ${guild.name} | ${
    _prettifyTime[state.time]
  }`;

  const embed = new EmbedBuilder()
    .setTitle(header)
    .setColor('#4fd6c8')
    .addFields(
      {
        name: 'Text',
        value: await getTopChannels(
          guild,
          'textMessage',
          state.time,
          page
        ).slice(0, 1024),
        inline: true,
      },
      {
        name: 'Voice',
        value: await getTopChannels(
          guild,
          'voiceMinute',
          state.time,
          page
        ).slice(0, 1024),
        inline: true,
      }
    );

  return {
    embeds: [embed],
    components: getChannelComponents(state, disabled),
  };
}

async function getTopChannels(guild, type, time, page) {
  const channelRanks = await rankModel.getChannelRanks(
    guild,
    type,
    time,
    page.from,
    page.to
  );
  if (!channelRanks || channelRanks.length == 0)
    return 'No entries found for this page.';

  const channelMention = (index) =>
    nameUtil.getChannelMention(
      guild.channels.cache,
      channelRanks[index].channelId
    );
  const emoji = type === 'voiceMinute' ? ':microphone2:' : ':writing_hand:';
  const channelValue = (index) =>
    type === 'voiceMinute'
      ? Math.round((channelRanks[index][time] / 60) * 10) / 10
      : channelRanks[index][time];

  const s = [];
  for (let i = 0; i < channelRanks.length; i++)
    s.push(
      `#${page.from + i} | ${channelMention(i)} ⇒ ${emoji} ${channelValue(i)}`
    );

  return s.join('\n');
}

async function generateChannelMembers(state, guild, myGuild, disabled) {
  if (!state.channel) {
    return {
      embeds: [
        new EmbedBuilder()
          .setTitle(`Toplist | ${_prettifyTime[state.time]}`)
          .setColor('#4fd6c8')
          .setDescription('Select a channel.'),
      ],
      components: getChannelMembersComponents(state, disabled),
    };
  }

  const type =
    state.channel.type === ChannelType.GuildVoice
      ? 'voiceMinute'
      : 'textMessage';

  const page = fct.extractPageSimple(state.page ?? 1, myGuild.entriesPerPage);

  const header = `Toplist for channel ${state.channel.name} | ${
    _prettifyTime[state.time]
  }`;

  const channelMemberRanks = await rankModel.getChannelMemberRanks(
    guild,
    state.channel.id,
    type,
    state.time,
    page.from,
    page.to
  );

  if (!channelMemberRanks || channelMemberRanks.length == 0) {
    return {
      embeds: [
        new EmbedBuilder()
          .setTitle(header)
          .setColor('#4fd6c8')
          .setDescription('No entries found for this page.'),
      ],
      components: getChannelMembersComponents(state, disabled),
    };
  }

  await nameUtil.addGuildMemberNamesToRanks(guild, channelMemberRanks);

  const e = new EmbedBuilder().setTitle(header).setColor('#4fd6c8');

  if (guild.bonusUntilDate > Date.now() / 1000)
    e.setDescription(
      `**!! Bonus XP Active !!** (ends <t:${guild.bonusUntilDate}:R>)`
    );

  let str = '',
    guildMemberName;

  for (let i = 0; i < channelMemberRanks.length; i++) {
    if (type == 'voiceMinute')
      str =
        ':microphone2: ' +
        Math.round((channelMemberRanks[i][state.time] / 60) * 10) / 10;
    else str = ':writing_hand: ' + channelMemberRanks[i][state.time];

    guildMemberName = (
      await nameUtil.getGuildMemberInfo(guild, channelMemberRanks[i].userId)
    ).name;
    e.addFields({
      name: `#${page.from + i}  ${guildMemberName}`,
      value: str,
      inline: true,
    });
  }

  return {
    embeds: [e],
    components: getChannelMembersComponents(state, disabled),
  };
}

async function generateGuildMembers(state, guild, myGuild, disabled) {
  const page = fct.extractPageSimple(state.page ?? 1, myGuild.entriesPerPage);

  let header = `Toplist for server ${guild.name} | ${
    _prettifyTime[state.time]
  }`;

  if (state.orderType === 'voiceMinute') header += ' | By voice (hours)';
  else if (state.orderType === 'textMessage') header += ' | By text (messages)';
  else if (state.orderType === 'invite') header += ' | By invites';
  else if (state.orderType === 'vote') header += ' | By ' + myGuild.voteTag;
  else if (state.orderType === 'bonus') header += ' | By ' + myGuild.bonusTag;
  else if (state.orderType === 'totalScore' || state.orderType === 'allScores')
    header += ' | By total XP';

  const memberRanks = await rankModel.getGuildMemberRanks(
    guild,
    state.orderType === 'allScores' ? 'totalScore' : state.orderType,
    state.time,
    page.from,
    page.to
  );

  if (!memberRanks || memberRanks.length === 0) {
    return {
      embeds: [
        new EmbedBuilder()
          .setTitle(header)
          .setColor('#4fd6c8')
          .setDescription('No entries found for this page.'),
      ],
      components: getMembersComponents(state, disabled),
    };
  }

  await nameUtil.addGuildMemberNamesToRanks(guild, memberRanks);

  const e = new EmbedBuilder().setTitle(header).setColor('#4fd6c8');

  if (guild.bonusUntilDate > Date.now() / 1000)
    e.setDescription(
      `**!! Bonus XP Active !!** (ends <t:${guild.bonusUntilDate}:R>)`
    );

  let i = 0;
  while (memberRanks.length > 0) {
    const memberRank = memberRanks.shift();

    const getScoreString = (type, time) => {
      if (type === 'textMessage' && guild.appData.textXp)
        return `:writing_hand: ${memberRank['textMessage' + time]}`;
      if (type === 'voiceMinute' && guild.appData.voiceXp)
        return `:microphone2: ${
          Math.round((memberRank['voiceMinute' + time] / 60) * 10) / 10
        }`;
      if (type === 'invite' && guild.appData.inviteXp)
        return `:envelope: ${memberRank['invite' + time]}`;
      if (type === 'vote' && guild.appData.voteXp)
        return `${myGuild.voteEmote} ${memberRank['vote' + time]}`;
      if (type === 'bonus' && guild.appData.bonusXp)
        return `${myGuild.bonusEmote} ${memberRank['bonus' + time]}`;
      return null;
    };

    const scoreStrings = [
      getScoreString('textMessage', state.time),
      getScoreString('voiceMinute', state.time),
      getScoreString('invite', state.time),
      getScoreString('vote', state.time),
      getScoreString('bonus', state.time),
    ].filter((s) => s);

    const getFieldScoreString = (type, time) => {
      if (type === 'totalScore') return '';
      else if (type === 'allScores') return `🔸 ${scoreStrings.join(' | ')}`;
      else return `🔸 ${getScoreString(type, time)}`;
    };

    e.addFields({
      name: `**#${page.from + i} ${memberRank.name}** \\🎖${Math.floor(
        memberRank.levelProgression
      )}`,
      value: `Total: ${
        memberRank['totalScore' + state.time]
      } XP ${getFieldScoreString(state.orderType, state.time)}`,
    });
    i++;
  }

  return {
    embeds: [e],
    components: getMembersComponents(state, disabled),
  };
}

function getGlobalComponents(window, time, page, disabled) {
  return [
    new ActionRowBuilder().setComponents(
      new StringSelectMenuBuilder()
        .setCustomId('top window')
        .setDisabled(disabled)
        .setOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel('Top Members')
            .setValue('members')
            .setDefault(window === 'members'),
          new StringSelectMenuOptionBuilder()
            .setLabel('Top Members in Channel')
            .setValue('channelMembers')
            .setDefault(window === 'channelMembers'),
          new StringSelectMenuOptionBuilder()
            .setLabel('Top Channels')
            .setValue('channels')
            .setDefault(window === 'channels')
        )
    ),
    new ActionRowBuilder().setComponents(
      new StringSelectMenuBuilder()
        .setCustomId('top time')
        .setDisabled(disabled)
        .setOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel('Alltime')
            .setValue('Alltime')
            .setDefault(time === 'Alltime'),
          new StringSelectMenuOptionBuilder()
            .setLabel('Year')
            .setValue('Year')
            .setDefault(time === 'Year'),
          new StringSelectMenuOptionBuilder()
            .setLabel('Month')
            .setValue('Month')
            .setDefault(time === 'Month'),
          new StringSelectMenuOptionBuilder()
            .setLabel('Week')
            .setValue('Week')
            .setDefault(time === 'Week'),
          new StringSelectMenuOptionBuilder()
            .setLabel('Day')
            .setValue('Day')
            .setDefault(time === 'Day')
        )
    ),
  ];
}

function getPaginationComponents(page, disabled) {
  return new ActionRowBuilder().setComponents(
    new ButtonBuilder()
      .setEmoji('⬅')
      .setCustomId(`top page ${page - 1}`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page <= 1 || disabled),
    new ButtonBuilder()
      .setLabel(page.toString())
      .setCustomId('top shouldNeverCall')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true),
    new ButtonBuilder()
      .setEmoji('➡️')
      .setCustomId(`top page ${page + 1}`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled)
  );
}

function getMembersComponents(state, disabled) {
  return [
    ...getGlobalComponents(state.window, state.time, state.page, disabled),
    new ActionRowBuilder().setComponents(
      new StringSelectMenuBuilder()
        .setCustomId('top orderType')
        .setDisabled(disabled)
        .setOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel('All')
            .setValue('allScores')
            .setDefault(state.orderType === 'allScores'),
          new StringSelectMenuOptionBuilder()
            .setLabel('Total')
            .setValue('totalScore')
            .setDefault(state.orderType === 'totalScore'),
          new StringSelectMenuOptionBuilder()
            .setLabel('Messages')
            .setValue('textMessage')
            .setDefault(state.orderType === 'textMessage'),
          new StringSelectMenuOptionBuilder()
            .setLabel('Voice time')
            .setValue('voiceMinute')
            .setDefault(state.orderType === 'voiceMinute'),
          new StringSelectMenuOptionBuilder()
            .setLabel('Invites')
            .setValue('invite')
            .setDefault(state.orderType === 'invite'),
          new StringSelectMenuOptionBuilder()
            .setLabel('Upvotes')
            .setValue('vote')
            .setDefault(state.orderType === 'vote'),
          new StringSelectMenuOptionBuilder()
            .setLabel('Bonus')
            .setValue('bonus')
            .setDefault(state.orderType === 'bonus')
        )
    ),
    getPaginationComponents(state.page, disabled),
    /*
    BLOCKED(d.js 14.8): Deselection kills bot process
    new ActionRowBuilder().setComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId('top channel')
        .setDisabled(disabled)
        .setChannelTypes(
          ChannelType.GuildText,
          ChannelType.GuildVoice,
          ChannelType.GuildAnnouncement,
          ChannelType.GuildForum,
        )
        .setMinValues(0)
        .setMaxValues(1),
    ), */
  ];
}

function getChannelMembersComponents(state, disabled) {
  return [
    ...getGlobalComponents(state.window, state.time, state.page, disabled),
    new ActionRowBuilder().setComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId('top channel')
        .setDisabled(disabled)
        .setChannelTypes(
          ChannelType.GuildText,
          ChannelType.GuildVoice,
          ChannelType.GuildAnnouncement,
          ChannelType.GuildForum
        )
        .setMinValues(1)
        .setMaxValues(1)
    ),
    getPaginationComponents(state.page, disabled),
  ];
}

function getChannelComponents(state, disabled) {
  return [
    ...getGlobalComponents(state.window, state.time, state.page, disabled),
    getPaginationComponents(state.page, disabled),
  ];
}

exports.sendMembersEmbed = async (i, type) => {
  await i.deferReply();
  await guildMemberModel.cache.load(i.member);
  const guild = await guildModel.storage.get(i.guild);

  if (!(await cooldownUtil.checkStatCommandsCooldown(i))) return;

  const page = fct.extractPageSimple(
    i.options.getInteger('page') || 1,
    guild.entriesPerPage
  );
  const time = i.options.getString('period') || 'Alltime';

  let header = `Toplist for server ${i.guild.name} from ${page.from} to ${page.to} | ${_prettifyTime[time]}`;

  if (type === 'voiceMinute') header += ' | By voice (hours)';
  else if (type === 'textMessage') header += ' | By text (messages)';
  else if (type === 'invite') header += ' | By invites';
  else if (type === 'vote') header += ' | By ' + guild.voteTag;
  else if (type === 'bonus') header += ' | By ' + guild.bonusTag;
  else header += ' | By total XP';

  const memberRanks = await rankModel.getGuildMemberRanks(
    i.guild,
    type,
    time,
    page.from,
    page.to
  );
  if (!memberRanks || memberRanks.length == 0) {
    return await i.editReply({
      content: 'No entries found for this page.',
      ephemeral: true,
    });
  }
  await nameUtil.addGuildMemberNamesToRanks(i.guild, memberRanks);

  const e = new EmbedBuilder().setTitle(header).setColor('#4fd6c8');

  if (guild.bonusUntilDate > Date.now() / 1000)
    e.setDescription(
      `**!! Bonus XP Active !!** (ends <t:${guild.bonusUntilDate}:R> \n`
    );

  if (i.client.appData.settings.footer)
    e.setFooter({ text: i.client.appData.settings.footer });

  let iter = 0;
  let scoreStrings;
  let memberRank;
  while (memberRanks.length > 0) {
    scoreStrings = [];
    memberRank = memberRanks.shift();

    if (i.guild.appData.textXp)
      scoreStrings.push(`:writing_hand: ${memberRank['textMessage' + time]}`);
    if (i.guild.appData.voiceXp)
      scoreStrings.push(
        `:microphone2: ${
          Math.round((memberRank['voiceMinute' + time] / 60) * 10) / 10
        }`
      );
    if (i.guild.appData.inviteXp)
      scoreStrings.push(`:envelope: ${memberRank['invite' + time]}`);
    if (i.guild.appData.voteXp)
      scoreStrings.push(guild.voteEmote + ' ' + memberRank['vote' + time]);
    if (i.guild.appData.bonusXp)
      scoreStrings.push(guild.bonusEmote + ' ' + memberRank['bonus' + time]);
    e.addFields({
      name: `**#${page.from + iter} ${memberRank.name}** \\🎖${Math.floor(
        memberRank.levelProgression
      )}`,
      value: `${memberRank['totalScore' + time]} XP \\⬄ ${scoreStrings.join(
        ':black_small_square:'
      )}`,
    });
    iter++;
  }

  await i.editReply({
    embeds: [e],
  });
};
