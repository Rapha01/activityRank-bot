const guildMemberModel = require('../models/guild/guildMemberModel.js');
const guildModel = require('../models/guild/guildModel.js');
const rankModel = require('../models/rankModel.js');
const fct = require('../../util/fct.js');
const cooldownUtil = require('../util/cooldownUtil.js');
const nameUtil = require('../util/nameUtil.js');
const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');

const _timedef = (_ => _
  .setName('period')
  .setDescription('The time period to check')
  .addChoices(
    { name: 'Day', value: 'Day' },
    { name: 'Week', value: 'Week' },
    { name: 'Month', value: 'Month' },
    { name: 'Year', value: 'Year' },
  )
);
const _page = (_ => _
  .setName('page')
  .setDescription('The page to list')
  .setMinValue(1)
  .setMaxValue(100)
);

module.exports.data = new SlashCommandBuilder()
  .setName('top')
  .setDescription('Toplists for the server')
  .addSubcommandGroup(scg => scg
    .setName('members')
    .setDescription('The top members in...')
    .addSubcommand(sc => sc
      .setName('server')
      .setDescription('The top members in the server')
      .addStringOption(_timedef)
      .addIntegerOption(_page)
      .addStringOption(o => o
        .setName('type')
        .setDescription('Order by a type of XP')
        .addChoices(
          { name: 'Text', value: 'textMessage' },
          { name: 'Voice', value: 'voiceMinute' },
          { name: 'Like', value: 'vote' },
          { name: 'Invite', value: 'invite' },
        )))
    .addSubcommand(sc => sc
      .setName('channel')
      .setDescription('The top members in the specified channel')
      .addChannelOption(o => o
        .setName('channel')
        .setDescription('The channel to check')
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildVoice, ChannelType.GuildAnnouncement, ChannelType.GuildForum))
      .addStringOption(_timedef)
      .addIntegerOption(_page)))
  .addSubcommandGroup(scg => scg
    .setName('channels')
    .setDescription('The top channels in...')
    .addSubcommand(sc => sc
      .setName('server')
      .setDescription('The top channels in the server')
      .addStringOption(o => o
        .setName('type')
        .setDescription('The type of channel')
        .addChoices(
          { name: 'Text', value: 'textMessage' },
          { name: 'Voice', value: 'voiceMinute' },
        )
        .setRequired(true))
      .addStringOption(_timedef)
      .addIntegerOption(_page))
    .addSubcommand(sc => sc
      .setName('member')
      .setDescription('The top channels used by the specified member')
      .addUserOption(o => o
        .setName('member')
        .setDescription('The member to find the top channels of')
        .setRequired(true))
      .addStringOption(o => o
        .setName('type')
        .setDescription('The type of channel')
        .addChoices(
          { name: 'Text', value: 'textMessage' },
          { name: 'Voice', value: 'voiceMinute' },
        )
        .setRequired(true))
      .addStringOption(_timedef)
      .addIntegerOption(_page)));

const _prettifyTime = {
  Day: 'Today',
  Week: 'Past week',
  Month: 'This month',
  Year: 'This year',
  Alltime: 'Forever',
};

exports.sendMembersEmbed = async (i, type) => {
  await i.deferReply();
  await guildMemberModel.cache.load(i.member);
  const guild = await guildModel.storage.get(i.guild);

  if (!await cooldownUtil.checkStatCommandsCooldown(i)) return;

  const page = fct.extractPageSimple(i.options.getInteger('page') || 1, guild.entriesPerPage);
  const time = i.options.getString('period') || 'Alltime';


  let header = `Toplist for server ${i.guild.name} from ${page.from} to ${page.to} | ${_prettifyTime[time]}`;

  if (type === 'voiceMinute') header += ' | By voice (hours)';
  else if (type === 'textMessage') header += ' | By text (messages)';
  else if (type === 'invite') header += ' | By invites';
  else if (type === 'vote') header += ' | By ' + guild.voteTag;
  else if (type === 'bonus') header += ' | By ' + guild.bonusTag;
  else header += ' | By total XP';

  const memberRanks = await rankModel.getGuildMemberRanks(i.guild, type, time, page.from, page.to);
  if (!memberRanks || memberRanks.length == 0) {
    return await i.editReply({
      content: 'No entries found for this page.',
      ephemeral: true,
    });
  }
  await nameUtil.addGuildMemberNamesToRanks(i.guild, memberRanks);

  const e = new EmbedBuilder()
    .setTitle(header)
    .setColor('#4fd6c8');

  if (guild.bonusUntilDate > Date.now() / 1000)
    e.setDescription(`**!! Bonus XP Active !!** (ends <t:${guild.bonusUntilDate}:R> \n`);

  if (i.client.appData.settings.footer) e.setFooter({ text: i.client.appData.settings.footer });

  let iter = 0;
  let scoreStrings;
  let memberRank;
  while (memberRanks.length > 0) {
    scoreStrings = [];
    memberRank = memberRanks.shift();

    if (i.guild.appData.textXp)
      scoreStrings.push(`:writing_hand: ${memberRank['textMessage' + time]}`);
    if (i.guild.appData.voiceXp)
      scoreStrings.push(`:microphone2: ${(Math.round(memberRank['voiceMinute' + time] / 60 * 10) / 10)}`);
    if (i.guild.appData.inviteXp)
      scoreStrings.push(`:envelope: ${memberRank['invite' + time]}`);
    if (i.guild.appData.voteXp)
      scoreStrings.push(guild.voteEmote + ' ' + memberRank['vote' + time]);
    if (i.guild.appData.bonusXp)
      scoreStrings.push(guild.bonusEmote + ' ' + memberRank['bonus' + time]);
    e.addFields({
      name: `**#${page.from + iter} ${memberRank.name}** \\🎖${Math.floor(memberRank.levelProgression)}`,
      value: `${memberRank['totalScore' + time]} XP \\⬄ ${scoreStrings.join(':black_small_square:')}`,
    });
    iter++;
  }

  await i.editReply({
    embeds: [e],
  });
};
