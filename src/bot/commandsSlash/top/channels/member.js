const guildMemberModel = require('../../../models/guild/guildMemberModel.js');
const guildModel = require('../../../models/guild/guildModel.js');
const fct = require('../../../../util/fct.js');
const rankModel = require('../../../models/rankModel.js');
const nameUtil = require('../../../util/nameUtil.js');
const { EmbedBuilder } = require('discord.js');

const _prettifyTime = {
  Day: 'Today',
  Week: 'Past week',
  Month: 'This month',
  Year: 'This year',
  Alltime: 'Forever',
};
const _prettifyType = {
  textMessage: 'Text',
  voiceMinute: 'Voice',
};

module.exports.execute = async (i) => {
  await i.deferReply();
  await guildMemberModel.cache.load(i.member);
  const guild = await guildModel.storage.get(i.guild);


  const page = fct.extractPageSimple(i.options.getInteger('page') || 1, guild.entriesPerPage);
  console.log(page);
  const time = i.options.getString('period') || 'Alltime';
  const member = i.options.getMember('member');

  const type = i.options.getString('type');

  const guildMemberInfo = await nameUtil.getGuildMemberInfo(i.guild, member.id);

  const header = `${_prettifyType[type]} channel toplist for ${
    guildMemberInfo.name} from ${page.from} to ${page.to} | ${_prettifyTime[time]}`;

  const guildMemberTopChannels = await rankModel.getGuildMemberTopChannels(i.guild, member.id, type, time, page.from, page.to);

  if (!guildMemberTopChannels || guildMemberTopChannels.length == 0) {
    return await i.followUp({
      content: 'No entries found for this page.',
      ephemeral: true,
    });
  }

  const embed = new EmbedBuilder()
    .setTitle(header)
    .setColor('#4fd6c8');

  let str = '';
  for (let iter = 0; iter < guildMemberTopChannels.length; iter++) {
    if (type == 'voiceMinute')
      str = ':microphone2: ' + (Math.round(guildMemberTopChannels[iter][time] / 60 * 10) / 10);
    else if (type == 'textMessage')
      str = ':writing_hand: ' + guildMemberTopChannels[iter][time];

    embed.addFields({
      name: `#${page.from + iter} ${
        nameUtil.getChannelName(i.guild.channels.cache, guildMemberTopChannels[iter].channelId)}`,
      value: str,
    });
  }

  await i.followUp({ embeds:[embed] });
};