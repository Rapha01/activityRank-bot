const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const cooldownUtil = require('../util/cooldownUtil.js');
const guildMemberModel = require('../models/guild/guildMemberModel.js');
const guildModel = require('../models/guild/guildModel.js');
const rankModel = require('../models/rankModel.js');
const fct = require('../../util/fct.js');
const nameUtil = require('../util/nameUtil.js');
const userModel = require('../models/userModel.js');


module.exports.data = new SlashCommandBuilder()
  .setName('rank')
  .setDescription('Find your or another member\'s rank')
  .addUserOption(o => o
    .setName('member')
    .setDescription('The member to check the rank of'))
  .addStringOption(o => o
    .setName('period')
    .setDescription('The time period to check')
    .addChoices(
      { name: 'Day', value: 'Day' },
      { name: 'Week', value: 'Week' },
      { name: 'Month', value: 'Month' },
      { name: 'Year', value: 'Year' },
    ));

module.exports.execute = async (i) => {
  await i.deferReply();
  await guildMemberModel.cache.load(i.member);

  if (!await cooldownUtil.checkStatCommandsCooldown(i)) return;

  const myGuild = await guildModel.storage.get(i.guild);

  const targetMember = i.options.getMember('member') ?? i.member;
  const time = i.options.getString('period') || 'Alltime';

  const rank = await rankModel.getGuildMemberRank(i.guild, targetMember.id);
  // const max = await rankModel.countGuildRanks(i.guild);

  const textPosition = await rankModel.getGuildMemberRankPosition(i.guild, targetMember.id, 'textMessage' + time);
  const voicePosition = await rankModel.getGuildMemberRankPosition(i.guild, targetMember.id, 'voiceMinute' + time);
  const invitePosition = await rankModel.getGuildMemberRankPosition(i.guild, targetMember.id, 'invite' + time);
  const votePosition = await rankModel.getGuildMemberRankPosition(i.guild, targetMember.id, 'vote' + time);
  const bonusPosition = await rankModel.getGuildMemberRankPosition(i.guild, targetMember.id, 'bonus' + time);
  const totalScorePosition = await rankModel.getGuildMemberRankPosition(i.guild, targetMember.id, 'totalScore' + time);

  const guildMemberInfo = await nameUtil.getGuildMemberInfo(i.guild, targetMember.id);
  const levelProgression = fct.getLevelProgression(rank.totalScoreAlltime, i.guild.appData.levelFactor);

  let description = '';
  if (myGuild.bonusUntilDate > Date.now() / 1000) {
    description = `**!! Bonus XP Active !!** (${
      Math.round((((myGuild.bonusUntilDate - Date.now() / 1000) / 60 / 60) * 10) / 10)
    }h left) \n`;
  }

  await userModel.cache.load(targetMember.user);

  const embed = new EmbedBuilder()
    .setAuthor({ name: `${time} stats on server ${i.guild.name}` })
    .setColor('#4fd6c8')
    .setDescription(description)
    .setThumbnail(targetMember.user.avatarURL({ dynamic:true }))
    .setFooter(i.client.appData.settings.footer ? i.client.appData.settings.footer : '');

  const scoreStrings = [];
  const infoStrings = [];
  if (i.guild.appData.textXp)
    scoreStrings.push(`:writing_hand: ${rank['textMessage' + time]} (# ${textPosition})`);
  if (i.guild.appData.voiceXp)
    scoreStrings.push(`:microphone2: ${Math.round(rank['voiceMinute' + time] / 60 * 10) / 10} (# ${voicePosition})`);
  if (i.guild.appData.inviteXp)
    scoreStrings.push(`:envelope: ${rank['invite' + time]} (# ${invitePosition})`);
  if (i.guild.appData.voteXp)
    scoreStrings.push(`${myGuild.voteEmote} ${rank['vote' + time]} (# ${votePosition})`);
  if (i.guild.appData.bonusXp)
    scoreStrings.push(`${myGuild.bonusEmote} ${rank['bonus' + time]} (# ${bonusPosition})`);

  infoStrings.push('Total XP: ' + Math.round(rank['totalScore' + time]) + ' (#' + totalScorePosition + ')');
  infoStrings.push('Next Level: ' + (Math.floor(levelProgression % 1 * 100)) + '%\n');

  embed.addField(
    '#' + totalScorePosition + ' **' + guildMemberInfo.name + '** 🎖 ' + Math.floor(levelProgression),
    infoStrings.join('\n'),
  );
  embed.addField('Stats', scoreStrings.join('\n'));

  await i.editReply({
    embeds: [embed],
  });

  console.log('  Sent score.');
};
