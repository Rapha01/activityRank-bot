const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const guildMemberModel = require('../models/guild/guildMemberModel.js');
const guildModel = require('../models/guild/guildModel.js');
const userModel = require('../models/userModel.js');
const utilModel = require('../models/utilModel.js');
const nameUtil = require('../util/nameUtil.js');
const cooldownUtil = require('../util/cooldownUtil.js');
const { stripIndent } = require('common-tags');
const fct = require('../../util/fct.js');

module.exports.data = new SlashCommandBuilder()
  .setName('memberinfo')
  .setDescription('Show information on a member.')
  .addUserOption((o) =>
    o.setName('member').setDescription('The member to show information about')
  );

module.exports.execute = async function (i) {
  const member = i.options.getMember('member') ?? i.member;
  await guildMemberModel.cache.load(i.member);
  const myGuild = await guildModel.storage.get(i.guild);

  if (!(await cooldownUtil.checkStatCommandsCooldown(i))) return;

  await userModel.cache.load(member.user);
  const myTargetUser = await userModel.storage.get(member.user);

  const myTargetMember = await guildMemberModel.storage.get(i.guild, member.id);
  const targetMemberInfo = await nameUtil.getGuildMemberInfo(
    i.guild,
    member.id
  );

  const lastActivities = await utilModel.storage.getLastActivities(
    i.guild,
    member.id,
    true
  );
  for (const act in lastActivities) {
    if (!lastActivities[act]) lastActivities[act] = 'n/a';
    else
      lastActivities[
        act
      ] = `<t:${lastActivities[act]}>, <t:${lastActivities[act]}:R>`;
  }
  const inviterInfo = await nameUtil.getGuildMemberInfo(
    i.guild,
    myTargetMember.inviter
  );
  if (inviterInfo.name == 'User left [0]')
    inviterInfo.name = 'No inviter set. Use `/inviter` to set one!';

  let lastActivityStr = '';
  if (i.guild.appData.textXp)
    lastActivityStr += `Last textmessage: ${lastActivities.textMessage}\n`;
  if (i.guild.appData.voiceXp)
    lastActivityStr += `Last voiceminute: ${lastActivities.voiceMinute}\n`;
  if (i.guild.appData.inviteXp)
    lastActivityStr += `Last invite: ${lastActivities.invite}\n`;
  if (i.guild.appData.voteXp)
    lastActivityStr += `Last vote: ${lastActivities.vote}\n`;
  if (i.guild.appData.bonusXp)
    lastActivityStr += `Last bonus: ${lastActivities.bonus}\n`;
  
  targetMemberInfo.joinedAt = Math.ceil(targetMemberInfo.joinedAt / 1000);
  
  if (myTargetUser.patreonTierUntilDate > Date.now() / 1000 && myTargetUser.patreonTier > 0) {
    targetMemberInfo.patreonText = stripIndent`
        Active Tier: ${myTargetUser.patreonTier} (${fct.getPatreonTierName(myTargetUser.patreonTier)})
        Valid until: <t:${myTargetUser.patreonTierUntilDate}:D>, <t:${myTargetUser.patreonTierUntilDate}:R>`;
  } else {
    targetMemberInfo.patreonText = stripIndent`No active Tier`;
  }

  const embed = new EmbedBuilder()
    .setAuthor({
      name: `Info for ${targetMemberInfo.name} in server ${i.guild.name}`,
    })
    .setColor('#4fd6c8')
    .setThumbnail(targetMemberInfo.avatarUrl)
    .addFields(
      {
        name: 'General',
        value: stripIndent`
        Joined: <t:${targetMemberInfo.joinedAt}:D>, <t:${targetMemberInfo.joinedAt}:R>
        Inviter: ${inviterInfo.name}`,
      },
      {
        name: 'Patreon',
        value: targetMemberInfo.patreonText
      },
      {
        name: 'Settings',
        value: stripIndent`
        Notify levelup via Direct Message: ${
          myGuild.notifyLevelupDm ? 'Yes' : 'No'
        }
        Reaction Vote: ${myGuild.reactionVote ? 'Yes' : 'No'}`,
      },
      { name: 'Recent Activity', value: lastActivityStr }
    );

  await i.reply({ embeds: [embed] });
};
