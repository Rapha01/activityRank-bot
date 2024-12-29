import { ApplicationCommandOptionType, time, type APIEmbed, type Guild } from 'discord.js';
import { getMemberModel } from '../models/guild/guildMemberModel.js';
import { getGuildModel } from '../models/guild/guildModel.js';
import { getUserModel } from '../models/userModel.js';
import nameUtil, { getGuildMemberInfo } from '../util/nameUtil.js';
import { handleStatCommandsCooldown } from '../util/cooldownUtil.js';
import { stripIndent } from 'common-tags';
import fct from '../../util/fct.js';
import { getShardDb } from '#models/shardDb/shardDb.js';
import { command } from '#bot/util/registry/command.js';

export default command.basic({
  data: {
    name: 'memberinfo',
    description: 'Show information about a member.',
    options: [
      {
        type: ApplicationCommandOptionType.User,
        name: 'member',
        description: 'The member to show information about.',
      },
    ],
  },
  async execute({ interaction }) {
    const member = interaction.options.getMember('member') ?? interaction.member;

    const cachedGuild = await getGuildModel(interaction.guild);

    if ((await handleStatCommandsCooldown(interaction)).denied) return;

    const userModel = await getUserModel(member.user);
    const myTargetUser = await userModel.fetch();

    const cachedMember = await getMemberModel(member);
    const myTargetMember = await cachedMember.fetch();
    const targetMemberInfo = await nameUtil.getGuildMemberInfo(interaction.guild, member.id);

    const lastActivities = await getLastActivities(interaction.guild, member.id);

    const inviterInfo = await getGuildMemberInfo(interaction.guild, myTargetMember.inviter);
    if (inviterInfo.name == 'User left [0]')
      inviterInfo.name = 'No inviter set. Use `/inviter` to set one!';

    const getActivityString = (
      name: string,
      // this is a number instead of a boolean because this is a value from the database. It will be either 1 or 0.
      enabled: number,
      lastTime: number | null,
    ): string | null => {
      if (!enabled) return null;
      const timeString = lastTime ? `${time(lastTime)}, ${time(lastTime, 'R')}` : 'n/a';
      return enabled ? `Last ${name}: ${timeString}` : null;
    };

    const lastActivityStr = [
      getActivityString('text message', cachedGuild.db.textXp, lastActivities.textMessage),
      getActivityString('voice minute', cachedGuild.db.voiceXp, lastActivities.voiceMinute),
      getActivityString('invite', cachedGuild.db.inviteXp, lastActivities.invite),
      getActivityString('vote', cachedGuild.db.voteXp, lastActivities.vote),
      getActivityString('bonus', cachedGuild.db.bonusXp, lastActivities.vote),
    ]
      .filter(Boolean)
      .join('\n');

    targetMemberInfo.joinedAt =
      typeof targetMemberInfo.joinedAt === 'string'
        ? targetMemberInfo.joinedAt
        : Math.ceil(targetMemberInfo.joinedAt / 1000);

    const patreonTierUntilDate = new Date(Number.parseInt(myTargetUser.patreonTierUntilDate) * 1000);

    const patreonText =
      patreonTierUntilDate.getTime() > Date.now() / 1000 && myTargetUser.patreonTier > 0
        ? stripIndent`
          Active Tier: ${myTargetUser.patreonTier} (${fct.getPatreonTierName(
            myTargetUser.patreonTier,
          )})
          Valid until: ${time(patreonTierUntilDate, 'D')}, ${time(patreonTierUntilDate, 'R')}`
        : 'No active Tier';

    const embed: APIEmbed = {
      author: { name: `Info for ${targetMemberInfo.name} in ${interaction.guild.name}` },
      color: 0x4fd6c8,
      thumbnail: targetMemberInfo.avatarUrl ? { url: targetMemberInfo.avatarUrl } : undefined,
      fields: [
        {
          name: 'General',
          value: stripIndent`
        Joined: <t:${targetMemberInfo.joinedAt}:D>, <t:${targetMemberInfo.joinedAt}:R>
        Inviter: ${inviterInfo.name}`,
        },
        { name: 'Patreon', value: patreonText },
        {
          name: 'Settings',
          value: stripIndent`
        Notify levelup via Direct Message: ${cachedGuild.db.notifyLevelupDm ? 'Yes' : 'No'}
        Reaction Vote: ${cachedGuild.db.reactionVote ? 'Yes' : 'No'}`,
        },
        { name: 'Recent Activity', value: lastActivityStr },
      ],
    };

    await interaction.reply({ embeds: [embed] });
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
    res?.changeDate ? Number.parseInt(res.changeDate) : null;

  const [textMessage, voiceMinute, invite, vote, bonus] = results;

  return {
    textMessage: getResult(textMessage),
    voiceMinute: getResult(voiceMinute),
    invite: getResult(invite),
    vote: getResult(vote),
    bonus: getResult(bonus),
  };
}
