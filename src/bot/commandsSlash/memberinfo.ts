import { SlashCommandBuilder, EmbedBuilder, time, type Guild } from 'discord.js';
import { getMemberModel } from '../models/guild/guildMemberModel.js';
import { getGuildModel } from '../models/guild/guildModel.js';
import { getUserModel } from '../models/userModel.js';
import nameUtil from '../util/nameUtil.js';
import cooldownUtil from '../util/cooldownUtil.js';
import { stripIndent } from 'common-tags';
import fct from '../../util/fct.js';
import { registerSlashCommand } from 'bot/util/commandLoader.js';
import { getShardDb } from 'models/shardDb/shardDb.js';

registerSlashCommand({
  data: new SlashCommandBuilder()
    .setName('memberinfo')
    .setDescription('Show information on a member.')
    .addUserOption((o) =>
      o.setName('member').setDescription('The member to show information about'),
    ),
  execute: async function (i) {
    const member = i.options.getMember('member') ?? i.member;

    const cachedGuild = await getGuildModel(i.guild);

    if (!(await cooldownUtil.checkStatCommandsCooldown(i))) return;

    const userModel = await getUserModel(member.user);
    const myTargetUser = await userModel.fetch();

    const cachedMember = await getMemberModel(member);
    const myTargetMember = await cachedMember.fetch();
    const targetMemberInfo = await nameUtil.getGuildMemberInfo(i.guild, member.id);

    const lastActivities = await getLastActivities(i.guild, member.id);

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

    console.warn('Tgt User', myTargetUser);

    const patreonTierUntilDate = new Date(parseInt(myTargetUser.patreonTierUntilDate) * 1000);

    const patreonText =
      patreonTierUntilDate.getTime() > Date.now() / 1000 && myTargetUser.patreonTier > 0
        ? stripIndent`
          Active Tier: ${myTargetUser.patreonTier} (${fct.getPatreonTierName(
            myTargetUser.patreonTier,
          )})
          Valid until: ${time(patreonTierUntilDate, 'D')}, ${time(patreonTierUntilDate, 'R')}`
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

export interface LastActivities {
  textMessage: null | number;
  voiceMinute: null | number;
  invite: null | number;
  vote: null | number;
  bonus: null | number;
}

export async function getLastActivities(guild: Guild, userId: string): Promise<LastActivities> {
  const { dbHost } = await getGuildModel(guild);
  const db = getShardDb(dbHost);
  const keys = ['textMessage', 'voiceMinute', 'invite', 'vote', 'bonus'] as const;

  const results = await Promise.all(
    keys.map((k) =>
      db
        .selectFrom(k)
        .select('changeDate')
        .where('guildId', '=', guild.id)
        .where('userId', '=', userId)
        .orderBy('changeDate', 'desc')
        .limit(1)
        .executeTakeFirst(),
    ),
  );

  const getResult = (res: { changeDate: string } | undefined) =>
    res?.changeDate ? parseInt(res.changeDate) : null;

  const [textMessage, voiceMinute, invite, vote, bonus] = results;

  return {
    textMessage: getResult(textMessage),
    voiceMinute: getResult(voiceMinute),
    invite: getResult(invite),
    vote: getResult(vote),
    bonus: getResult(bonus),
  };
}
