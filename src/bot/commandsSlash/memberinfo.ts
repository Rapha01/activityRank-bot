import { SlashCommandBuilder, EmbedBuilder, time } from 'discord.js';
import guildMemberModel from '../models/guild/guildMemberModel.js';
import guildModel from '../models/guild/guildModel.js';
import userModel from '../models/userModel.js';
import utilModel from '../models/utilModel.js';
import nameUtil from '../util/nameUtil.js';
import cooldownUtil from '../util/cooldownUtil.js';
import { stripIndent } from 'common-tags';
import fct from '../../util/fct.js';
import { registerSlashCommand } from 'bot/util/commandLoader.js';

registerSlashCommand({
  data: new SlashCommandBuilder()
    .setName('memberinfo')
    .setDescription('Show information on a member.')
    .addUserOption((o) =>
      o.setName('member').setDescription('The member to show information about'),
    ),
  execute: async function (i) {
    const member = i.options.getMember('member') ?? i.member;

    const cachedGuild = await guildModel.cache.get(i.guild);

    if (!(await cooldownUtil.checkStatCommandsCooldown(i))) return;

    const myTargetUser = await userModel.storage.get(member.user);

    const myTargetMember = await guildMemberModel.storage.get(i.guild, member.id);
    const targetMemberInfo = await nameUtil.getGuildMemberInfo(i.guild, member.id);

    const lastActivities = await utilModel.storage.getLastActivities(i.guild, member.id);

    const inviterInfo = await nameUtil.getGuildMemberInfo(i.guild, myTargetMember.inviter);
    if (inviterInfo.name == 'User left [0]')
      inviterInfo.name = 'No inviter set. Use `/inviter` to set one!';

    const fmtActivity = (act: number | null) => (act ? `${time(act)}, ${time(act, 'R')}` : 'n/a');

    const lastActivityStr = [
      cachedGuild.db.textXp ? `Last textmessage: ${fmtActivity(lastActivities.textMessage)}` : null,
      cachedGuild.db.voiceXp
        ? `Last voiceminute: ${fmtActivity(lastActivities.voiceMinute)}`
        : null,
      cachedGuild.db.inviteXp ? `Last invite: ${fmtActivity(lastActivities.invite)}` : null,
      cachedGuild.db.voteXp ? `Last vote: ${fmtActivity(lastActivities.vote)}` : null,
      cachedGuild.db.bonusXp ? `Last bonus: ${fmtActivity(lastActivities.bonus)}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    targetMemberInfo.joinedAt =
      typeof targetMemberInfo.joinedAt === 'string'
        ? targetMemberInfo.joinedAt
        : Math.ceil(targetMemberInfo.joinedAt / 1000);

    const patreonText =
      myTargetUser.patreonTierUntilDate > Date.now() / 1000 && myTargetUser.patreonTier > 0
        ? stripIndent`
          Active Tier: ${myTargetUser.patreonTier} (${fct.getPatreonTierName(
            myTargetUser.patreonTier,
          )})
          Valid until: ${time(myTargetUser.patreonTierUntilDate, 'D')}, ${time(
            myTargetUser.patreonTierUntilDate,
            'R',
          )}`
        : 'No active Tier';

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
          value: patreonText,
        },
        {
          name: 'Settings',
          value: stripIndent`
          Notify levelup via Direct Message: ${cachedGuild.db.notifyLevelupDm ? 'Yes' : 'No'}
          Reaction Vote: ${cachedGuild.db.reactionVote ? 'Yes' : 'No'}`,
        },
        { name: 'Recent Activity', value: lastActivityStr },
      );

    await i.reply({ embeds: [embed] });
  },
});
