import { getMemberModel } from 'bot/models/guild/guildMemberModel.js';
import { getGuildModel } from 'bot/models/guild/guildModel.js';
import { getUserModel } from 'bot/models/userModel.js';
import { time, type GuildMember } from 'discord.js';
import { getRawVoteMultiplier, hasNoXpRole } from 'util/fct.js';
import { getWaitTime } from './cooldownUtil.js';
import statFlushCache from 'bot/statFlushCache.js';
import { PATREON_URL } from './constants.js';
import { assertUnreachable } from './typescript.js';

/**
 * The status of an attempt to upvote another member.
 */
export enum UpvoteAttempt {
  /** Successfully upvoted the target */
  Success,
  /** The guild has upvotes disabled globally. */
  DisabledGuild,
  /** Attempted to upvote a bot. */
  TargetBot,
  /** Attempted to upvote self. */
  TargetSelf,
  /** The target has a noXP role that prohibits adding XP. */
  TargetHasNoXP,
  /** The user has voted recently. */
  TimeoutNotElapsed,
}

type UpvoteAttemptResult =
  | { status: UpvoteAttempt.Success; multiplier: number }
  | {
      status:
        | UpvoteAttempt.DisabledGuild
        | UpvoteAttempt.TargetBot
        | UpvoteAttempt.TargetSelf
        | UpvoteAttempt.TargetHasNoXP;
    }
  | {
      status: UpvoteAttempt.TimeoutNotElapsed;
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
  if (voter.guild.id !== target.guild.id)
    throw new Error('Attempted to upvote members in different guilds');

  const cachedGuild = await getGuildModel(voter.guild);

  if (!cachedGuild.db.voteXp) return { status: UpvoteAttempt.DisabledGuild };
  if (target.user.bot) return { status: UpvoteAttempt.TargetBot };
  if (target.id == voter.id) return { status: UpvoteAttempt.TargetSelf };

  const cachedMember = await getMemberModel(voter);

  if (await hasNoXpRole(target)) return { status: UpvoteAttempt.TargetHasNoXP };

  // Check Command cooldown
  const toWait = getWaitTime(
    cachedMember.cache.lastVoteDate,
    cachedGuild.db.voteCooldownSeconds * 1000,
  );

  if (toWait.remaining > 0)
    return { status: UpvoteAttempt.TimeoutNotElapsed, nextUpvote: toWait.next };

  // Get author multiplier
  const userModel = await getUserModel(voter.user);
  const myUser = await userModel.fetch();
  const multiplier = getRawVoteMultiplier(
    parseInt(myUser.lastTopggUpvoteDate),
    parseInt(myUser.patreonTierUntilDate),
    myUser.patreonTier,
  );

  cachedMember.cache.lastVoteDate = new Date();

  await statFlushCache.addVote(target, multiplier);

  return { status: UpvoteAttempt.Success, multiplier };
}

export function getUpvoteMessage(
  result: UpvoteAttemptResult,
  target: GuildMember,
): { content: string; ephemeral: boolean } {
  const { status } = result;
  if (status === UpvoteAttempt.DisabledGuild)
    return { content: 'Voting is disabled on this server.', ephemeral: true };
  else if (status === UpvoteAttempt.TargetBot)
    return { content: 'You cannot upvote bots.', ephemeral: true };
  else if (status === UpvoteAttempt.TargetSelf)
    return { content: 'You cannot upvote yourself.', ephemeral: true };
  else if (status === UpvoteAttempt.TargetHasNoXP)
    return {
      content:
        'The member you are trying to upvote cannot be upvoted, because of an assigned noXp role.',
      ephemeral: true,
    };
  else if (status === UpvoteAttempt.TimeoutNotElapsed) {
    const next = time(result.nextUpvote, 'R');
    return {
      content: `You already voted recently. You will be able to vote again ${next}.`,
      ephemeral: true,
    };
  } else if (status === UpvoteAttempt.Success) {
    const { multiplier } = result;
    if (multiplier > 1) {
      return {
        content: `You have successfully voted for ${target}. Your vote counts \`${multiplier}x\`.`,
        ephemeral: false,
      };
    } else {
      return {
        content: `You have successfully voted for ${target}. Upvote the bot on top.gg or subscribe [on Patreon](<${PATREON_URL}>) to increase your voting power!`,
        ephemeral: false,
      };
    }
  } else {
    assertUnreachable(status);
  }
}
