const guildMemberModel = require('../../models/guild/guildMemberModel.js');
const guildModel = require('../../models/guild/guildModel.js');
const cooldownUtil = require('../../util/cooldownUtil.js');
const fct = require('../../../util/fct.js');
const rankModel = require('../../models/rankModel.js');
const nameUtil = require('../../util/nameUtil.js');
const { MessageEmbed } = require('discord.js');


module.exports.execute = async (i) => {
  await guildMemberModel.cache.load(i.member);
  const guild = await guildModel.storage.get(i.guild);

  if (!await cooldownUtil.checkStatCommandsCooldown(i)) return;

  const page = fct.extractPageSimple(i.options.getInteger('page'), guild.entriesPerPage);
  const time = i.options.getString('period') || 'Alltime';

  // const type = 'totalScore';
  const header = `Toplist for server ${i.guild.name} from ${page.from} to ${page.to} | ${time}`;
  const memberRanks = await rankModel.getGuildMemberRanks(i.guild, 'totalScore', time, page.from, page.to);
  if (!memberRanks || memberRanks.length == 0) {
    return i.reply({
      content: 'No entries found for this page.',
      ephemeral: true,
    });
  }
  await nameUtil.addGuildMemberNamesToRanks(i.guild, memberRanks);

  // Embed Header
  let description = '';
  if (guild.bonusUntilDate > Date.now() / 1000) {
    description = `**!! Bonus XP Active !!** (${
      (Math.round(((guild.bonusUntilDate - Date.now() / 1000) / 60 / 60) * 10) / 10)
    }h left) \n`;
  }

  const embed = new MessageEmbed()
    .setTitle(header)
    .setDescription(description)
    .setColor('#4fd6c8');

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
    embed.addField(
      `**#${page.from + iter} ${memberRank.name}** \\🎖${Math.floor(memberRank.levelProgression)}`,
      `${memberRank['totalScore' + time]} XP \\⬄ ${scoreStrings.join(':black_small_square:')}`,
    );
    iter++;
  }

  await i.reply({
    embeds: [embed],
    ephemeral: true,
  });
};