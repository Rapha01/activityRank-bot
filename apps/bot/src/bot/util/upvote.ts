import { type GuildMember, type InteractionReplyOptions, time } from 'discord.js';
import invariant from 'tiny-invariant';
import { getMemberModel } from '#bot/models/guild/guildMemberModel.js';
import { getGuildModel } from '#bot/models/guild/guildModel.js';
import { getUserModel } from '#bot/models/userModel.js';
import statFlushCache from '#bot/statFlushCache.js';
import { getVoteMultiplier, hasNoXpRole } from '#util/fct.js';
import { PATREON_URL } from './constants.js';
import { getWaitTime } from './cooldownUtil.js';
import { assertUnreachable } from './typescript.js';

/**
 * A cache of members in the format `guildId.userId` to the Date they can next upvote again.
 * TODO: This is a temporary fix because other measures (caches on the GuildMember object) should already be sufficient.
 */
const upvoteCache = new Map<string, Date>();

/**
 * The status of an attempt to upvote another member.
 */
export const UpvoteAttempt = {
  /** Successfully upvoted the target */
  Success: 'Success',
  /** The guild has upvotes disabled globally. */
  DisabledGuild: 'DisabledGuild',
  /** Attempted to upvote a bot. */
  TargetBot: 'TargetBot',
  /** Attempted to upvote self. */
  TargetSelf: 'TargetSelf',
  /** The target has a noXP role that prohibits adding XP. */
  TargetHasNoXP: 'TargetHasNoXP',
  /** The user has voted recently. */
  TimeoutNotElapsed: 'TimeoutNotElapsed',
} as const;

export type UpvoteAttempt = (typeof UpvoteAttempt)[keyof typeof UpvoteAttempt];

type UpvoteAttemptResult =
  | { status: typeof UpvoteAttempt.Success; multiplier: number }
  | {
      status:
        | typeof UpvoteAttempt.DisabledGuild
        | typeof UpvoteAttempt.TargetBot
        | typeof UpvoteAttempt.TargetSelf
        | typeof UpvoteAttempt.TargetHasNoXP;
    }
  | {
      status: typeof UpvoteAttempt.TimeoutNotElapsed;
      nextUpvote: Date;
    };

/**
 * Attempt to upvote a member. Fails if `voter` is on cooldown.
 * @param voter The member attempting to upvote the `target`
 * @param target The member that is being upvoted
 * @returns Whether the upvote succeeded
 */
export async function attemptUpvote(
  voter: GuildMember,
  target: GuildMember,
): Promise<UpvoteAttemptResult> {
  invariant(voter.guild.id === target.guild.id, 'sanity check; members must be in the same guild');

  const cachedGuild = await getGuildModel(voter.guild);

  if (!cachedGuild.db.voteXp) return { status: UpvoteAttempt.DisabledGuild };
  if (target.user.bot) return { status: UpvoteAttempt.TargetBot };
  if (target.id === voter.id) return { status: UpvoteAttempt.TargetSelf };

  const cachedMember = await getMemberModel(voter);

  if (await hasNoXpRole(target)) return { status: UpvoteAttempt.TargetHasNoXP };

  // Check Command cooldown
  const toWait = getWaitTime(
    cachedMember.cache.lastVoteDate,
    cachedGuild.db.voteCooldownSeconds * 1000,
  );

  if (toWait.remaining > 0)
    return { status: UpvoteAttempt.TimeoutNotElapsed, nextUpvote: toWait.next };

  // TODO: [FIXME] - the upvoteCache check should not be necessary as toWait should already handle this
  const cachedNextVote = upvoteCache.get(`${voter.guild.id}.${voter.id}`);
  if (cachedNextVote && cachedNextVote.getTime() > Date.now()) {
    voter.client.logger.warn(
      { cachedMember, cachedGuild },
      'vote cache caught by fallback measure',
    );
    return { status: UpvoteAttempt.TimeoutNotElapsed, nextUpvote: cachedNextVote };
  }

  // Get voter multiplier
  const userModel = await getUserModel(voter.user);
  const multiplier = getVoteMultiplier(await userModel.fetch());

  cachedMember.cache.lastVoteDate = new Date();

  await statFlushCache.addVote(target, multiplier);
  upvoteCache.set(
    `${voter.guild.id}.${voter.id}`,
    new Date(Date.now() + cachedGuild.db.voteCooldownSeconds * 1000),
  );

  return { status: UpvoteAttempt.Success, multiplier };
}

export function getUpvoteMessage(
  result: UpvoteAttemptResult,
  target: GuildMember,
): InteractionReplyOptions {
  const { status } = result;

  const ephemeral = (content: string) => ({ content, ephemeral: true });

  if (status === UpvoteAttempt.DisabledGuild) {
    return ephemeral('Voting is disabled on this server.');
  }
  if (status === UpvoteAttempt.TargetBot) {
    return ephemeral('You cannot upvote bots.');
  }
  if (status === UpvoteAttempt.TargetSelf) {
    return ephemeral('You cannot upvote yourself.');
  }
  if (status === UpvoteAttempt.TargetHasNoXP) {
    return ephemeral(
      'The member you are trying to upvote cannot be upvoted, because of an assigned noXp role.',
    );
  }
  if (status === UpvoteAttempt.TimeoutNotElapsed) {
    const next = time(result.nextUpvote, 'R');
    return ephemeral(`You already voted recently. You will be able to vote again ${next}.`);
  }
  if (status === UpvoteAttempt.Success) {
    if (result.multiplier > 1) {
      return {
        content: `You have successfully voted for ${target}. Your vote counts \`${result.multiplier}x\`.`,
        allowedMentions: { users: [target.id] },
      };
    }
    return {
      content: `You have successfully voted for ${target}. Upvote the bot on top.gg or [subscribe on Patreon](<${PATREON_URL}>) to increase your voting power!`,
      allowedMentions: { users: [target.id] },
    };
  }
  assertUnreachable(status);
}
